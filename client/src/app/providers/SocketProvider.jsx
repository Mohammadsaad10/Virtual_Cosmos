import { useEffect, useMemo, useState } from "react";
import { getSocket } from "../../services/socket";
import { SocketContext } from "./socketContext";

/**
 * Provides socket singleton and connection status to descendants.
 *
 * @param {{ children: React.ReactNode }} props - Provider props.
 * @returns {JSX.Element} Context provider.
 */
export function SocketProvider({ children }) {
  const [status, setStatus] = useState("connecting");

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    /**
     * Marks connection as online when transport is ready.
     */
    const onConnect = () => {
      setStatus("connected");
    };

    /**
     * Marks connection as disconnected when transport drops.
     */
    const onDisconnect = () => {
      setStatus("disconnected");
    };

    /**
     * Marks connection as errored when handshake fails.
     */
    const onConnectError = () => {
      setStatus("error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      socket,
      connectionStatus: status,
      isConnected: status === "connected",
    }),
    [socket, status],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
