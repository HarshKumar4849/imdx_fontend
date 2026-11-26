import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders overlays into document.body so parent transforms, filters,
 * or sticky headers never clip or constrain fixed-position modals.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
