import { SocketProvider } from "./app/providers/SocketProvider";
import { WorldProvider } from "./app/providers/WorldProvider";
import { useWorld } from "./app/providers/useWorld";
import { ChatPanel } from "./components/chat/ChatPanel";
import { CosmosStage } from "./components/cosmos/CosmosStage";
import { HeaderBar } from "./components/layout/HeaderBar";
import { NearbyUsersList } from "./components/layout/NearbyUsersList";
import { useProximityStatus } from "./hooks/useProximityStatus";

/**
 * Main world scene composed from server-synchronized world state.
 *
 * @returns {JSX.Element} Virtual Cosmos page.
 */
function CosmosPage() {
  const {
    session,
    users,
    selfUser,
    activeRooms,
    selectedRoomId,
    selectedMessages,
    worldConfig,
    connectionStatus,
    sendMessage,
    selectRoom,
  } = useWorld();

  const { activeCount } = useProximityStatus(activeRooms);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-350 flex-col gap-4 px-4 py-4 lg:px-6">
      <HeaderBar
        sessionName={session.name}
        connectionStatus={connectionStatus}
        onlineCount={users.length}
        activeConnectionCount={activeCount}
      />

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)]">
        <section className="rounded-xl border border-cyan-200/20 bg-slate-900/70 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Arrow keys to move</span>
            <span>Radius: {worldConfig.proximityRadius}u</span>
          </div>

          <CosmosStage
            users={users}
            selfUserId={session.userId}
            worldWidth={worldConfig.width}
            worldHeight={worldConfig.height}
            proximityRadius={worldConfig.proximityRadius}
          />
        </section>

        <aside className="grid grid-rows-[auto_1fr] gap-4">
          <NearbyUsersList rooms={activeRooms} />

          <ChatPanel
            rooms={activeRooms}
            selectedRoomId={selectedRoomId}
            messages={selectedMessages}
            selfUserId={selfUser?.userId || session.userId}
            onSelectRoom={selectRoom}
            onSendMessage={sendMessage}
          />
        </aside>
      </main>
    </div>
  );
}

/**
 * App root with providers for socket transport and world state.
 *
 * @returns {JSX.Element} Root application shell.
 */
function App() {
  return (
    <SocketProvider>
      <WorldProvider>
        <CosmosPage />
      </WorldProvider>
    </SocketProvider>
  );
}

export default App;
