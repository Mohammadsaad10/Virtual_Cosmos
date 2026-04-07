import { useEffect, useRef, useState } from "react";

/**
 * Detects whether keyboard interaction is happening inside an editable element.
 *
 * @param {EventTarget | null} target - Keyboard event target.
 * @returns {boolean} True when target is text-editable.
 */
function isEditableTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox']",
    ),
  );
}

/**
 * Handles message drafting and submit interactions.
 *
 * @param {{
 *   disabled: boolean,
 *   onSubmit: (text: string) => void
 * }} props - Message input props.
 * @returns {JSX.Element} Message input form.
 */
export function MessageInput({ disabled, onSubmit }) {
  const [draft, setDraft] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    /**
     * Focuses chat input when Enter is pressed outside editable elements.
     *
     * @param {KeyboardEvent} event
     */
    const handleGlobalEnterFocus = (event) => {
      if (event.key !== "Enter") {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    if (!disabled) {
      window.addEventListener("keydown", handleGlobalEnterFocus);
    }

    return () => {
      window.removeEventListener("keydown", handleGlobalEnterFocus);
    };
  }, [disabled]);

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const text = draft.trim();
    if (!text || disabled) {
      return;
    }

    onSubmit(text);
    setDraft("");
  };

  /**
   * Allows fast return to movement mode from chat focus.
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} event
   */
  const handleInputKeyDown = (event) => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    inputRef.current?.blur();
  };

  return (
    <div className="space-y-2">
      {!isInputFocused && !disabled ? (
        <p className="text-xs text-slate-400">
          Tip: Press Enter or click the box to start typing.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          maxLength={400}
          placeholder={disabled ? "Move closer to chat" : "Type a message..."}
          className="flex-1 rounded-lg border border-cyan-200/20 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-cyan-400/80 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          Send
        </button>
      </form>

      {isInputFocused && !disabled ? (
        <p className="text-xs text-slate-400">
          Tip: Press Esc to resume movement controls.
        </p>
      ) : null}
    </div>
  );
}
