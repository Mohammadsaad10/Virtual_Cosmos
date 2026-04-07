/**
 * Renders message timeline for the selected room.
 *
 * @param {{
 *   messages: Array<{ msgId?: string, fromUserId: string, text: string, ts: number }>,
 *   selfUserId: string
 * }} props - Message list props.
 * @returns {JSX.Element} Message list view.
 */
export function MessageList({ messages, selfUserId }) {
  if (!messages.length) {
    return (
      <div className="rounded-lg bg-slate-800/80 p-3 text-sm text-slate-300">
        No messages yet. Say hello when proximity chat is active.
      </div>
    );
  }

  return (
    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {messages.map((message, index) => {
        const fromSelf = message.fromUserId === selfUserId;
        const alignment = fromSelf
          ? "ml-auto bg-cyan-400/25"
          : "mr-auto bg-slate-700/90";

        return (
          <article
            key={message.msgId || `${message.ts}-${index}`}
            className={`w-fit max-w-[92%] rounded-xl px-3 py-2 text-sm text-slate-100 ${alignment}`}
          >
            <p>{message.text}</p>
          </article>
        );
      })}
    </div>
  );
}
