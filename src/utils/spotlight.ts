import type { PointerEvent } from 'react';

/**
 * Updates --mx and --my CSS custom properties on the nearest interactive card
 * so the radial spotlight gradient follows the pointer just like landing cards.
 */
export function updateCardSpotlight(event: PointerEvent<HTMLElement>) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const card = target.closest<HTMLElement>('.imdx-card-interactive');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  card.style.setProperty('--my', `${event.clientY - rect.top}px`);
}
