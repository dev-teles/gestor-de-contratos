import { useEffect, RefObject } from 'react';

type AnyRef = RefObject<HTMLElement | null>;

interface UseClickOutsideOptions {
  enabled?: boolean;
  closeOnEsc?: boolean;
}

/**
 * Custom hook to detect clicks (and touch events) outside of one or more referenced elements.
 * Also optionally handles the 'Escape' key.
 *
 * @param refs Single ref or array of refs to ignore clicks inside
 * @param handler Callback invoked when an outside click/escape occurs
 * @param options Optional configuration (enabled flag, closeOnEsc)
 */
export function useClickOutside(
  refs: AnyRef | AnyRef[],
  handler: () => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, closeOnEsc = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const refList = Array.isArray(refs) ? refs : [refs];

    function handleEvent(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      // If any of the provided refs contains the target, it's an inside click
      const isInside = refList.some((ref) => {
        return ref.current && ref.current.contains(target);
      });

      if (!isInside) {
        handler();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (closeOnEsc && event.key === 'Escape') {
        handler();
      }
    }

    document.addEventListener('mousedown', handleEvent, true);
    document.addEventListener('touchstart', handleEvent, true);
    if (closeOnEsc) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleEvent, true);
      document.removeEventListener('touchstart', handleEvent, true);
      if (closeOnEsc) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [refs, handler, enabled, closeOnEsc]);
}
