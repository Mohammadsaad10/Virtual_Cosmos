import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useSocket } from "./useSocket";
import { WorldContext } from "./worldContext";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { useKeyboardMovement } from "../../hooks/useKeyboardMovement";
import {
  MOVEMENT_EMIT_INTERVAL_MS,
  PLAYER_SPEED,
  PROXIMITY_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../../utils/constants";
import { clamp } from "../../utils/math";

/**
 * Generates deterministic guest identity for the current browser tab.
 *
 * @returns {{ userId: string, name: string, avatarColor: string }} Guest identity.
 */
function createGuestIdentity() {
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  const colorPalette = ["#38bdf8", "#34d399", "#f59e0b", "#f97316", "#a78bfa"];

  return {
    userId: crypto.randomUUID(),
    name: `Explorer-${suffix}`,
    avatarColor: colorPalette[suffix % colorPalette.length],
  };
}

/**
 * Creates a random but bounded spawn point for new sessions.
 *
 * @returns {{ x: number, y: number }} Spawn coordinates.
 */
function createSpawnPosition() {
  return {
    x: Math.round(Math.random() * (WORLD_WIDTH - 120)) + 60,
    y: Math.round(Math.random() * (WORLD_HEIGHT - 120)) + 60,
  };
}

/**
 * @typedef {Object} WorldState
 * @property {{ userId: string, name: string, avatarColor: string }} session
 * @property {Record<string, { userId: string, name: string, avatarColor: string, position: { x: number, y: number } }>} usersById
 * @property {Record<string, { roomId: string, peerUserId: string, peerName: string, distance: number }>} activeRooms
 * @property {Record<string, Array<{ roomId: string, fromUserId: string, text: string, ts: number, msgId?: string }>>} messagesByRoom
 * @property {string | null} selectedRoomId
 */

/**
 * @param {WorldState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {WorldState}
 */
function worldReducer(state, action) {
  switch (action.type) {
    case "SET_USERS": {
      const nextUsersById = {};
      for (const user of action.payload.users) {
        nextUsersById[user.userId] = user;
      }
      return {
        ...state,
        usersById: nextUsersById,
      };
    }

    case "UPDATE_SELF_POSITION": {
      const currentSelf = state.usersById[state.session.userId];
      if (!currentSelf) {
        return state;
      }

      return {
        ...state,
        usersById: {
          ...state.usersById,
          [state.session.userId]: {
            ...currentSelf,
            position: action.payload.position,
          },
        },
      };
    }

    case "ADD_ROOM": {
      const room = action.payload.room;
      const activeRooms = {
        ...state.activeRooms,
        [room.roomId]: room,
      };

      return {
        ...state,
        activeRooms,
        selectedRoomId: state.selectedRoomId || room.roomId,
      };
    }

    case "REMOVE_ROOM": {
      const roomId = action.payload.roomId;
      const activeRooms = { ...state.activeRooms };
      delete activeRooms[roomId];

      const roomIds = Object.keys(activeRooms);
      const selectedRoomId = roomIds.includes(state.selectedRoomId || "")
        ? state.selectedRoomId
        : roomIds[0] || null;

      return {
        ...state,
        activeRooms,
        selectedRoomId,
      };
    }

    case "SELECT_ROOM": {
      return {
        ...state,
        selectedRoomId: action.payload.roomId,
      };
    }

    case "APPEND_MESSAGE": {
      const message = action.payload.message;
      const existing = state.messagesByRoom[message.roomId] || [];

      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [message.roomId]: [...existing, message],
        },
      };
    }

    default:
      return state;
  }
}

/**
 * Provides authoritative client world state synchronized with socket events.
 *
 * @param {{ children: React.ReactNode }} props - Provider props.
 * @returns {JSX.Element} Context provider.
 */
export function WorldProvider({ children }) {
  const { socket, isConnected, connectionStatus } = useSocket();
  const { directionRef } = useKeyboardMovement();

  const session = useMemo(() => createGuestIdentity(), []);
  const initialPosition = useMemo(() => createSpawnPosition(), []);

  const [state, dispatch] = useReducer(worldReducer, {
    session,
    usersById: {
      [session.userId]: {
        ...session,
        position: initialPosition,
      },
    },
    activeRooms: {},
    messagesByRoom: {},
    selectedRoomId: null,
  });

  const usersByIdRef = useRef(state.usersById);
  useEffect(() => {
    usersByIdRef.current = state.usersById;
  }, [state.usersById]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    socket.emit("join", {
      userId: state.session.userId,
      name: state.session.name,
      avatarColor: state.session.avatarColor,
      position:
        usersByIdRef.current[state.session.userId]?.position ?? initialPosition,
    });
  }, [initialPosition, isConnected, socket, state.session]);

  const onUsersUpdate = useCallback((payload) => {
    const users = Array.isArray(payload?.users) ? payload.users : [];
    dispatch({ type: "SET_USERS", payload: { users } });
  }, []);

  const onProximityConnect = useCallback((payload) => {
    dispatch({
      type: "ADD_ROOM",
      payload: {
        room: {
          roomId: payload.roomId,
          peerUserId: payload.peerUserId,
          peerName: payload.peerName,
          distance: payload.distance,
        },
      },
    });
  }, []);

  const onProximityDisconnect = useCallback((payload) => {
    dispatch({
      type: "REMOVE_ROOM",
      payload: { roomId: payload.roomId },
    });
  }, []);

  const onReceiveMessage = useCallback((payload) => {
    dispatch({
      type: "APPEND_MESSAGE",
      payload: {
        message: {
          roomId: payload.roomId,
          fromUserId: payload.fromUserId,
          text: payload.text,
          ts: payload.ts,
          msgId: payload.msgId,
        },
      },
    });
  }, []);

  const socketHandlers = useMemo(
    () => ({
      users_update: onUsersUpdate,
      proximity_connect: onProximityConnect,
      proximity_disconnect: onProximityDisconnect,
      receive_message: onReceiveMessage,
    }),
    [
      onProximityConnect,
      onProximityDisconnect,
      onReceiveMessage,
      onUsersUpdate,
    ],
  );

  useSocketEvents(socket, socketHandlers);

  useEffect(() => {
    let rafId = 0;
    let previousAt = performance.now();
    let lastEmitAt = previousAt;
    let sequence = 0;

    /**
     * Advances local player with keyboard direction and syncs updates to server.
     *
     * @param {number} now - Animation frame timestamp.
     */
    const step = (now) => {
      const deltaSeconds = (now - previousAt) / 1000;
      previousAt = now;

      const direction = directionRef.current;
      const magnitude = Math.hypot(direction.x, direction.y);

      if (magnitude > 0) {
        const normalizedX = direction.x / magnitude;
        const normalizedY = direction.y / magnitude;

        const currentSelf = usersByIdRef.current[state.session.userId];

        if (currentSelf) {
          const distance = PLAYER_SPEED * deltaSeconds;
          const nextPosition = {
            x: clamp(
              currentSelf.position.x + normalizedX * distance,
              0,
              WORLD_WIDTH,
            ),
            y: clamp(
              currentSelf.position.y + normalizedY * distance,
              0,
              WORLD_HEIGHT,
            ),
          };

          dispatch({
            type: "UPDATE_SELF_POSITION",
            payload: { position: nextPosition },
          });

          if (isConnected && now - lastEmitAt >= MOVEMENT_EMIT_INTERVAL_MS) {
            sequence += 1;
            lastEmitAt = now;

            socket.emit("move", {
              userId: state.session.userId,
              position: nextPosition,
              seq: sequence,
              ts: Date.now(),
            });
          }
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [directionRef, isConnected, socket, state.session.userId]);

  const sendMessage = useCallback(
    (roomId, text) => {
      const trimmedText = String(text || "").trim();
      if (!trimmedText || !roomId) {
        return;
      }

      socket.emit("send_message", {
        roomId,
        fromUserId: state.session.userId,
        text: trimmedText,
        clientMsgId: crypto.randomUUID(),
        ts: Date.now(),
      });
    },
    [socket, state.session.userId],
  );

  const selectRoom = useCallback((roomId) => {
    dispatch({
      type: "SELECT_ROOM",
      payload: { roomId },
    });
  }, []);

  const activeRooms = useMemo(
    () => Object.values(state.activeRooms),
    [state.activeRooms],
  );

  const users = useMemo(
    () => Object.values(state.usersById),
    [state.usersById],
  );

  const selectedMessages = useMemo(() => {
    const fallbackRoomId =
      state.selectedRoomId || activeRooms[0]?.roomId || null;
    return fallbackRoomId ? state.messagesByRoom[fallbackRoomId] || [] : [];
  }, [activeRooms, state.messagesByRoom, state.selectedRoomId]);

  const value = useMemo(
    () => ({
      session: state.session,
      users,
      selfUser: state.usersById[state.session.userId] || null,
      activeRooms,
      selectedRoomId: state.selectedRoomId,
      selectedMessages,
      worldConfig: {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        proximityRadius: PROXIMITY_RADIUS,
      },
      connectionStatus,
      sendMessage,
      selectRoom,
    }),
    [
      activeRooms,
      connectionStatus,
      selectedMessages,
      sendMessage,
      selectRoom,
      state.selectedRoomId,
      state.session,
      state.usersById,
      users,
    ],
  );

  return (
    <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
  );
}
