import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, topmost last: only the top one reacts to Escape / Tab.
const openDialogs: HTMLElement[] = [];

/**
 * Accessible modal layer. Rendered in a portal (above the shell and the phone
 * tab bar) instead of the native top layer so that toasts raised while a
 * dialog is open stay visible. Provides focus containment, Escape to close,
 * background inertness and focus restoration. On phones the page's panel is
 * presented as a bottom sheet by CSS.
 */
export default function Dialog({ children, onClose, label, className = "", dismissOnBackdrop = false, sheet = false }: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
  /** Close when the dimmed backdrop is pressed (navigation sheets, not forms). */
  dismissOnBackdrop?: boolean;
  /** Always present as a bottom sheet, whatever the viewport. */
  sheet?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    openDialogs.push(node);
    root?.setAttribute("inert", "");
    node.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(element => element.offsetParent !== null || element === document.activeElement);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openDialogs.splice(openDialogs.indexOf(node), 1);
      if (!openDialogs.length) root?.removeAttribute("inert");
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className={`ui-dialog-layer ${sheet ? "is-sheet" : ""} ${className}`}
      onMouseDown={dismissOnBackdrop ? event => { if (event.target === event.currentTarget) onClose(); } : undefined}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="ui-dialog">
        {children}
      </div>
    </div>,
    document.body,
  );
}
