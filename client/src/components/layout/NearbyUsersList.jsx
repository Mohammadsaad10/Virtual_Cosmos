/**
 * Lists currently connected nearby users derived from active rooms.
 *
 * @param {{ rooms: Array<{ roomId: string, peerName: string, distance: number }> }} props - Nearby user list props.
 * @returns {JSX.Element} Nearby list panel.
 */
export function NearbyUsersList({ rooms }) {
  return (
    <section className="rounded-xl border border-cyan-200/20 bg-slate-900/70 p-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-200">
        Nearby Users
      </h2>

      {rooms.length === 0 ? (
        <p className="text-sm text-slate-300">
          Move closer to another explorer to establish chat.
        </p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room.roomId}
              className="flex items-center justify-between rounded-lg bg-slate-800/80 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-100">
                {room.peerName}
              </span>
              <span className="text-xs text-cyan-200/80">
                {Math.round(room.distance)}u
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
