import { useEffect, useRef } from "react";

const MOVEMENT_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/**
 * Detects whether the current keyboard event originated from an editable element.
 *
 * @param {EventTarget | null} target - Keyboard event target.
 * @returns {boolean} True when typing focus is in a text-editable element.
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
 * Tracks pressed movement keys and exposes direction vector through refs.
 *
 * @returns {{ directionRef: React.MutableRefObject<{ x: number, y: number }> }} Direction ref.
 */
export function useKeyboardMovement() {
  const pressedRef = useRef(new Set());
  const directionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    /**
     * Recomputes current direction from active key set.
     */
    const updateDirection = () => {
      const pressed = pressedRef.current;
      directionRef.current = {
        x: (pressed.has("right") ? 1 : 0) - (pressed.has("left") ? 1 : 0),
        y: (pressed.has("down") ? 1 : 0) - (pressed.has("up") ? 1 : 0),
      };
    };

    /**
     * @param {KeyboardEvent} event
     */
    const onKeyDown = (event) => {
      const mapped = MOVEMENT_KEYS[event.code];
      if (!mapped) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      pressedRef.current.add(mapped);
      updateDirection();
    };

    /**
     * @param {KeyboardEvent} event
     */
    const onKeyUp = (event) => {
      const mapped = MOVEMENT_KEYS[event.code];
      if (!mapped) {
        return;
      }

      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
      pressedRef.current.delete(mapped);
      updateDirection();
    };

    /**
     * Clears movement state when browser focus changes to avoid sticky keys.
     */
    const onWindowBlur = () => {
      pressedRef.current.clear();
      updateDirection();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  return { directionRef };
}
