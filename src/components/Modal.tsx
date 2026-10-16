import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel?: string;
  maxWidth?: string;
  headerExtra?: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell. Handles the things every modal in this app was
 * missing: role/aria wiring, Escape and backdrop dismissal, a focus trap,
 * background scroll lock, and returning focus to whatever opened it.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  children,
  closeLabel = 'Close dialog',
  maxWidth = 'max-w-2xl',
  headerExtra,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Keeps the keydown listener (bound once on mount) pointed at the current callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
      // mousedown, not click: a drag that starts inside and ends on the backdrop should not close.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-[#0b0e15] border border-slate-800 shadow-2xl focus:outline-none`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0b0e15]/95 backdrop-blur">
          <div id={titleId} className="min-w-0 flex-1">
            {title}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};
