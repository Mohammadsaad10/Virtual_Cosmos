import { ConnectionBadge } from "./ConnectionBadge";

/**
 * Displays top-level session and world status indicators.
 *
 * @param {{
 *   sessionName: string,
 *   connectionStatus: string,
 *   onlineCount: number,
 *   activeConnectionCount: number
 * }} props - Header props.
 * @returns {JSX.Element} Header bar.
 */
export function HeaderBar({
  sessionName,
  connectionStatus,
  onlineCount,
  activeConnectionCount,
}) {
  return (
    <header className="rounded-xl border border-cyan-200/20 bg-slate-900/80 px-4 py-3 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">
            Virtual Cosmos Session
          </p>
          <p className="text-lg font-semibold text-cyan-100">{sessionName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
          <ConnectionBadge connectionStatus={connectionStatus} />
          <span className="rounded-full bg-cyan-300/20 px-3 py-1">
            Online: {onlineCount}
          </span>
          <span className="rounded-full bg-indigo-300/20 px-3 py-1">
            Nearby: {activeConnectionCount}
          </span>
        </div>
      </div>
    </header>
  );
}
