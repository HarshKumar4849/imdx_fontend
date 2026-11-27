/**
 * Clean static backdrop container: relies on the CSS Tecmotiv watermark
 * on `.imdx-internal-canvas::before` without distracting background motion.
 */
export function InternalBackdrop() {
  return <div className="imdx-backdrop-layer" aria-hidden="true" />;
}
