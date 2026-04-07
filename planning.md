# Virtual Cosmos - Planning Document

## 1. Project Overview and Goals

### Product Goal

Build a multiplayer 2D virtual environment where users move in real time and automatically gain chat access when they are physically close in the world.

This implementation targets the required capabilities:

- Real-time user movement in a 2D canvas (PixiJS)
- Real-time position synchronization (Socket.IO)
- Proximity-based connect and disconnect logic
- Conditional chat availability based on proximity
- Clear and minimal UX with active connection visibility

### Success Criteria

- Multiple users can connect simultaneously and see each other moving with low latency.
- Proximity rules are consistent between users and server authority.
- Chat panel is enabled only when at least one valid proximity connection exists.
- Disconnect behavior is immediate and clear in both UX and backend state.

### Non-Functional Targets

- Smooth rendering at 60 FPS on modern browsers.
- Network update rate around 10 to 20 updates per second per client.
- Deterministic proximity behavior with minimal connect/disconnect flicker.
- Clean, modular codebase suitable for demo and future extension.

---

## 2. System Architecture (Client-Server Interaction)

### High-Level Model

- Client is responsible for input capture, local movement prediction, rendering, and chat UI.
- Server is authoritative for user registry, position broadcast, proximity evaluation, room membership, and message relay.
- MongoDB stores only data that must survive process restarts (profiles and optional message/session logs).

### Runtime Flow

1. User opens app and chooses display identity.
2. Client opens Socket.IO connection and emits join.
3. Server registers user and broadcasts users_update.
4. Client sends move events as position changes.
5. Server updates positions, recalculates proximity graph, emits proximity_connect and proximity_disconnect, then emits users_update.
6. Connected users exchange messages through send_message and receive_message events.

### Architecture Diagram

```text
[React + Pixi Client]
   | keyboard + UI actions
   v
[Socket.IO Client] <--------------------------> [Socket.IO Server]
                                                    |
                                                    | proximity engine
                                                    v
                                            [In-Memory World State]
                                                    |
                                                    | selective persistence
                                                    v
                                                [MongoDB]
```

### Server Subsystems

- Connection Manager: handles join/disconnect and user socket lifecycle.
- World State Store: user positions and active proximity edges.
- Proximity Engine: distance checks and edge diffing (connect/disconnect).
- Room Manager: creates deterministic room IDs and updates room membership.
- Chat Gateway: validates and relays chat messages.

---

## 3. Folder Structure (Monorepo: /client + /server)

### Current Synced Structure

```text
virtual_cosmos/
  planning.md
  project-understanding-and-verification.md
  client/
    public/
    src/
      app/
        providers/
          socketContext.js
          SocketProvider.jsx
          useSocket.js
          useWorld.js
          worldContext.js
          WorldProvider.jsx
      components/
        layout/
          HeaderBar.jsx
          ConnectionBadge.jsx
        cosmos/
          CosmosStage.jsx
        chat/
          ChatPanel.jsx
          MessageList.jsx
          MessageInput.jsx
      hooks/
        useKeyboardMovement.js
        useSocketEvents.js
        useProximityStatus.js
      services/
        socket.js
      utils/
        math.js
        constants.js
      App.jsx
      main.jsx
      index.css
    package.json
    vite.config.js
    eslint.config.js
  server/
    src/
      config/
        env.js
      db/
        mongoose.js
      models/
        User.js
        Message.js
      sockets/
        index.js
        handlers/
          joinHandler.js
          moveHandler.js
          chatHandler.js
          disconnectHandler.js
        proximity/
          distance.js
          proximityEngine.js
          roomId.js
      state/
        worldState.js
      routes/
        health.js
      app.js
      server.js
    .env.example
    package.json
```

### Rationale

- Client keeps rendering, networking, and UI concerns separated.
- Server isolates socket handlers from pure proximity logic for easier testing.
- Shared conventions around constants reduce client-server mismatch.

---

## 4. Socket Event Schema

| Event Name           | Direction        | Payload Schema                                                   | Description                                                  |
| -------------------- | ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| join                 | Client -> Server | { userId, name, avatarColor, position: { x, y } }                | Registers user in world state and socket session.            |
| move                 | Client -> Server | { userId, position: { x, y }, seq, ts }                          | Sends latest local position updates.                         |
| users_update         | Server -> Client | { users: [{ userId, name, avatarColor, position, isSelf }], ts } | Broadcasts current world snapshot (or delta, if optimized).  |
| proximity_connect    | Server -> Client | { roomId, peerUserId, peerName, distance, connectedAt }          | Notifies user that chat is now enabled with a nearby peer.   |
| proximity_disconnect | Server -> Client | { roomId, peerUserId, reason, disconnectedAt }                   | Notifies user that chat must be disabled for that peer/room. |
| send_message         | Client -> Server | { roomId, fromUserId, text, clientMsgId, ts }                    | Sends chat message to a valid proximity room.                |
| receive_message      | Server -> Client | { roomId, fromUserId, text, msgId, ts }                          | Delivers chat message to all members of room.                |

### Event Handling Notes

- The server is authoritative for room validity and proximity state.
- Clients should ignore stale position updates using seq and/or ts ordering.
- Message send should be rejected server-side if sender is no longer in room.

---

## 5. Component Tree (React Breakdown)

```text
App
  HeaderBar
    ConnectionBadge
  CosmosPage
    CosmosStage (Pixi canvas root)
      AvatarLayer
        AvatarSprite (for each remote user)
      LocalPlayerMarker
  SidePanel
    NearbyUsersList
    ChatPanel (visible only when at least one active room)
      MessageList
      MessageInput
```

### Responsibilities

- App: shell layout, providers, session initialization.
- CosmosStage: renders world bounds, avatars, and movement updates.
- ChatPanel: room selection (if multiple), messages, and send action.
- ConnectionBadge: quick status of active proximity connections.

---

## 6. Proximity Logic Design

### Distance Formula

Two users A and B are connected when:

$$
d(A, B) = \sqrt{(x_A - x_B)^2 + (y_A - y_B)^2}
$$

Connect condition:

$$
d(A, B) < R
$$

Disconnect condition:

$$
d(A, B) \geq R
$$

### Proposed Radius

- Base proximity radius R = 120 world units.
- World units should map consistently to Pixi stage coordinates.

### Evaluation Strategy

- Recompute proximity whenever:
  - a move event is accepted
  - a user joins
  - a user disconnects
- For each moved user, check distance against all others (O(n) per mover).
- Maintain a set of active edges: edgeKey = minUserId|maxUserId.
- Diff previous edges vs current edges:
  - new edge -> emit proximity_connect to both users
  - removed edge -> emit proximity_disconnect to both users

### Room Creation and Destruction

- Deterministic room ID per user pair:

```text
roomId = "dm:" + sorted([userA, userB]).join(":")
```

- On connect: server makes both sockets join roomId.
- On disconnect: server removes both sockets from roomId.
- Room is considered destroyed when no sockets remain (automatic in Socket.IO).

### Edge Cases

- Fast movement jumps: server still evaluates authoritative final position.
- Simultaneous movement: use latest accepted position per user.
- Reconnects: clean old socket state before attaching new socket.

---

## 7. State Management Plan

### Client State Boundaries

| State Item                                           | Where It Lives                         | Why                                          |
| ---------------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| Local input state (pressed keys, intended direction) | Local hook state (useKeyboardMovement) | High-frequency and view-local concern.       |
| Local player position (predicted)                    | World context reducer                  | Needed by renderer and socket emitter.       |
| Remote users map                                     | World context reducer                  | Shared by canvas and nearby list.            |
| Active proximity rooms                               | World context reducer                  | Drives chat visibility and room selection.   |
| Selected chat room and draft text                    | ChatPanel local state                  | UI-only and short-lived.                     |
| Socket instance and connection status                | SocketProvider context                 | Singleton lifecycle and global event wiring. |

### Server State Boundaries

| State Item                           | Storage       | Notes                                          |
| ------------------------------------ | ------------- | ---------------------------------------------- |
| Connected users and socket IDs       | In-memory map | Real-time source of truth.                     |
| User positions                       | In-memory map | Updated on move events.                        |
| Active proximity edges               | In-memory set | Needed for connect/disconnect diffs.           |
| Chat messages (optional persistence) | MongoDB       | Keep only if assignment/demo requires history. |

---

## 8. Database Schema (MongoDB)

### Persistence Principle

Only persist data needed across restarts. Live position and active connections remain in memory.

| Collection              | Field          | Type     | Required | Notes                          |
| ----------------------- | -------------- | -------- | -------- | ------------------------------ |
| users                   | \_id           | ObjectId | Yes      | Primary key                    |
| users                   | userId         | String   | Yes      | Public stable ID, unique index |
| users                   | name           | String   | Yes      | Display name                   |
| users                   | avatarColor    | String   | No       | Hex color or theme token       |
| users                   | createdAt      | Date     | Yes      | Default now                    |
| users                   | lastSeenAt     | Date     | Yes      | Updated on disconnect          |
| messages (optional)     | \_id           | ObjectId | Yes      | Primary key                    |
| messages (optional)     | roomId         | String   | Yes      | Pair room ID                   |
| messages (optional)     | fromUserId     | String   | Yes      | Sender                         |
| messages (optional)     | text           | String   | Yes      | Sanitized plain text           |
| messages (optional)     | createdAt      | Date     | Yes      | Message timestamp              |
| session_logs (optional) | \_id           | ObjectId | Yes      | Primary key                    |
| session_logs (optional) | userId         | String   | Yes      | User identity                  |
| session_logs (optional) | socketId       | String   | Yes      | Connection instance            |
| session_logs (optional) | connectedAt    | Date     | Yes      | Connection start               |
| session_logs (optional) | disconnectedAt | Date     | No       | Connection end                 |

### Recommended Indexes

```text
users: { userId: 1 } unique
messages: { roomId: 1, createdAt: -1 }
session_logs: { userId: 1, connectedAt: -1 }
```

---

## 9. API Routes (REST Endpoints)

Even with socket-first architecture, a few REST endpoints are useful:

| Method | Route   | Purpose                                        | Response         |
| ------ | ------- | ---------------------------------------------- | ---------------- |
| GET    | /health | Liveness probe for deployment and local checks | { status: "ok" } |

Current implementation note:

- Implemented route: /health.
- No additional REST routes are required for current assignment scope.

### Why Minimal REST

- Movement and chat are latency-sensitive and stay in Socket.IO.
- REST handles initialization, diagnostics, and optional history fetch.

---

## 10. UI and UX Plan

### Primary Experience States

1. Join State

- Minimal welcome card with name input and enter button.
- Optional random avatar color preview.

2. In-Cosmos State

- Fullscreen Pixi world canvas.
- Local avatar highlighted subtly.
- Remote avatars labeled with names.

3. Connected Chat State

- Chat panel appears when at least one proximity connection exists.
- Room selector appears only if multiple simultaneous room connections exist.

4. Disconnected Chat State

- Chat panel collapses or disables input with clear status text.

### Interface Elements

- Top status bar: connection status and active nearby count.
- Right side panel: nearby users and chat.
- Canvas overlays: boundary hints and optional proximity ring around self.

### Transition Plan

- Chat panel slide/fade transition in 150 to 220 ms.
- Connection badge count animate on change.
- Avoid heavy animation in avatar movement (movement itself is the primary motion).

### Accessibility Basics

- Keyboard movement support (Arrow keys).
- Chat input focus behavior:
  - Enter focuses chat input when chat is connected and focus is outside editable elements.
  - Esc blurs input to resume movement controls.
- Sufficient color contrast for avatar labels and controls.

---

## 11. Risks and Tradeoffs

| Risk or Tradeoff                                                   | Impact                     | Mitigation                                                                |
| ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------- |
| Frequent move events can overload server at scale                  | High CPU and network usage | Throttle client emits (for example 15 to 20 Hz), send only when changed   |
| Position jitter causes connect/disconnect flicker near radius edge | Poor UX and noisy events   | Optional hysteresis buffer or short debounce window                       |
| Client-side cheating by sending impossible positions               | Invalid proximity outcomes | Server-side speed clamp and bounds validation                             |
| O(n^2) global distance checks with many users                      | Scalability limits         | Start with O(n) per mover; later use spatial partitioning (grid/quadtree) |
| Message delivery to stale rooms                                    | Incorrect chat behavior    | Validate membership before broadcasting                                   |
| MongoDB persistence can slow chat path if synchronous              | Latency spikes             | Fire-and-forget async writes or queue persistence                         |

---
