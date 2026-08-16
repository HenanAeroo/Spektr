import { RefObject, useEffect } from "react";

/**
 * Traps keyboard focus inside an open modal for accessibility (RGAA): focuses
 * the first focusable element on open, cycles Tab/Shift+Tab within the modal,
 * closes on Escape, and restores focus to the previously active element on
 * unmount.
 *
 * @param ref - Ref to the modal container element.
 * @param isOpen - Whether the modal is currently open (the trap is a no-op when
 *   closed).
 * @param onClose - Called when the user presses Escape.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (isOpen === false) {
      return;
    }

    const modal = ref.current;
    if (!modal) return;

    const elementBefore = document.activeElement as HTMLElement;

    const FOCUSABLE_SELECTOR =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      modal.querySelectorAll(FOCUSABLE_SELECTOR),
    ) as HTMLElement[];

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      elementBefore?.focus();
    };
  }, [isOpen, onClose]);
}
