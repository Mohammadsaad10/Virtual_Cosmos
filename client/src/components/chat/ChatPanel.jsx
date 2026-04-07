import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

/**
 * Proximity-aware chat panel that activates only with nearby users.
 *
 * @param {{
 *   rooms: Array<{ roomId: string, peerName: string }>,
 *   selectedRoomId: string | null,
 *   messages: Array<{ msgId?: string, fromUserId: string, text: string, ts: number }>,
 *   selfUserId: string,
 *   onSelectRoom: (roomId: string) => void,
 *   onSendMessage: (roomId: string, text: string) => void
 * }} props - Chat panel props.
 * @returns {JSX.Element} Chat panel.
 */
export function ChatPanel({
  rooms,
  selectedRoomId,
  messages,
  selfUserId,
  onSelectRoom,
  onSendMessage,
}) {
  const hasRooms = rooms.length > 0;
  const activeRoom =
    rooms.find((room) => room.roomId === selectedRoomId) || rooms[0] || null;

  return (
    <section className="flex h-full flex-col rounded-xl border border-cyan-200/20 bg-slate-900/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
          Proximity Chat
        </h2>
        <span className="text-xs text-slate-300">
          {hasRooms ? "Connected" : "Disconnected"}
        </span>
      </div>

      {hasRooms ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {rooms.map((room) => {
              const selected =
                room.roomId === (selectedRoomId || activeRoom?.roomId);
              return (
                <button
                  key={room.roomId}
                  type="button"
                  onClick={() => onSelectRoom(room.roomId)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    selected
                      ? "bg-cyan-300 text-slate-950"
                      : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  }`}
                >
                  {room.peerName}
                </button>
              );
            })}
          </div>

          <div className="flex-1">
            <MessageList messages={messages} selfUserId={selfUserId} />
          </div>

          <div className="mt-3">
            <MessageInput
              disabled={!activeRoom}
              onSubmit={(text) => {
                if (!activeRoom) {
                  return;
                }
                onSendMessage(activeRoom.roomId, text);
              }}
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-slate-800/80 p-3 text-sm text-slate-300">
          Chat unlocks automatically when another user enters your proximity
          radius.
        </div>
      )}
    </section>
  );
}
