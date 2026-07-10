import { RefObject, useEffect } from "react";

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
