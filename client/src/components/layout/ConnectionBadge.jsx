/**
 * Small status badge for network connection state.
 *
 * @param {{ connectionStatus: string }} props - Connection props.
 * @returns {JSX.Element} Badge element.
 */
export function ConnectionBadge({ connectionStatus }) {
  const toneByStatus = {
    connected: "bg-emerald-400/20 text-emerald-200 border-emerald-300/40",
    connecting: "bg-amber-400/20 text-amber-200 border-amber-300/40",
    disconnected: "bg-slate-400/20 text-slate-200 border-slate-300/40",
    error: "bg-rose-400/20 text-rose-200 border-rose-300/40",
  };

  const normalized = toneByStatus[connectionStatus]
    ? connectionStatus
    : "disconnected";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneByStatus[normalized]}`}
    >
      {normalized}
    </span>
  );
}
