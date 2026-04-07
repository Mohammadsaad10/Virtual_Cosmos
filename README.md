# Virtual Cosmos

A real-time multiplayer 2D virtual world where users move on a shared canvas and can chat only when they are physically close.

## Highlights

- Real-time multiplayer movement using Socket.IO.
- Client-side prediction with latency-aware reconciliation for smoother movement on high ping.
- PixiJS-rendered 2D world with live avatar updates.
- Proximity-based auto connect and disconnect logic.
- Conditional direct-message chat enabled only for active proximity rooms.
- Clean client/server separation with server-authoritative world state.

## Tech Stack

- Frontend: React, Vite, PixiJS, Tailwind CSS, Socket.IO Client
- Backend: Node.js, Express, Socket.IO Server, Mongoose
- Database: MongoDB (optional at runtime; app still works without DB connection)

## Repository Structure

```text
virtual_cosmos/
  client/   # React + PixiJS UI
  server/   # Express + Socket.IO backend
  planning.md
```

Build output note:

- `client/dist` is a generated artifact and is intentionally not committed.
- Render Static Site builds it during deployment.

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

### 1) Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2) Configure Environment

In server, create .env from .env.example and adjust values if needed.

Server environment variables:

| Variable             | Default               | Purpose                                  |
| -------------------- | --------------------- | ---------------------------------------- |
| PORT                 | 4000                  | Backend HTTP + Socket.IO port            |
| CLIENT_ORIGIN        | http://localhost:5173 | Allowed frontend origin for CORS         |
| MONGO_URI            | (empty)               | MongoDB connection string                |
| WORLD_WIDTH          | 1600                  | World width                              |
| WORLD_HEIGHT         | 900                   | World height                             |
| PROXIMITY_RADIUS     | 120                   | Connect radius                           |
| MOVEMENT_THROTTLE_MS | 66                    | Server-side movement acceptance interval |

Client environment variables:

| Variable        | Default               | Purpose                   |
| --------------- | --------------------- | ------------------------- |
| VITE_SERVER_URL | http://localhost:4000 | Backend URL for Socket.IO |

### 3) Run the App

Start backend:

```bash
cd server
npm run dev
```

Start frontend (new terminal):

```bash
cd client
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

## Scripts

Client:

- npm run dev
- npm run build
- npm run lint
- npm run preview

Server:

- npm run dev
- npm run start

## Objective Coverage

- 2D world rendering: Implemented with PixiJS.
- Multiplayer visibility: Implemented via users_update snapshots.
- Real-time movement sync: Implemented via move events.
- Proximity connect/disconnect: Implemented on server with edge diffing.
- Chat only when connected: Implemented with server room validation and conditional chat UI.
- Active nearby count in UI: Implemented in header and nearby list.

## Movement Sync Strategy

To keep movement responsive under real-world latency, the client uses prediction plus controlled server reconciliation.

1. Local prediction:
- Movement is applied immediately on the client each animation frame for instant response.

2. Throttled network updates:
- Client emits `move` events at a controlled interval (about 66ms) with sequence metadata.

3. Reconciliation policy:
- While movement input is active (and for a short grace window), local self-position is preserved to avoid visible snap-back.
- Once input settles, server-authoritative position is blended in smoothly for small and medium corrections.
- Very large divergences are allowed to snap to server state to maintain authority and consistency.

4. Jitter guard for tab stalls:
- Frame delta is capped so temporary frame drops (common in private/incognito tabs) do not cause large local jumps followed by harsh corrections.

Result:
- Better perceived smoothness with server-authoritative correctness maintained.


## Manual Verification Flow

1. Open two browser windows.
2. Join as two different users.
3. Move users with arrow keys.
4. Confirm proximity connect activates chat.
5. Move apart and confirm proximity disconnect disables chat.
6. Confirm messages are delivered only while connected.
