import { useEffect, useRef } from 'react';

interface MeshNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  depth: 'far' | 'near';
  hue: 'blue' | 'teal';
}

/**
 * Dual-depth geometric plexus network backdrop inspired by IMDX dataspace topology:
 * crisp foreground cobalt/teal triangulated nodes over a soft depth-blurred background mesh.
 */
export function InternalBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!container || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let dpr = 1;
    let rafId = 0;
    let nodes: MeshNode[] = [];
    const pointer = { x: -9999, y: -9999, active: false };

    const rand = (seed: number) => {
      const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return v - Math.floor(v);
    };

    const syncBounds = () => {
      const bounds = container.getBoundingClientRect();
      rectLeft = bounds.left;
      rectTop = bounds.top;
      return bounds;
    };

    const initNodes = () => {
      const bounds = syncBounds();
      width = Math.max(320, bounds.width);
      height = Math.max(320, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nearCount = width < 768 ? 34 : 56;
      const farCount = width < 768 ? 14 : 22;
      nodes = [];

      // Cluster foreground constellation organically along left/bottom-left & soft right balance
      for (let i = 0; i < nearCount; i += 1) {
        const r1 = rand(i + 1);
        const r2 = rand(i + 101);
        const onRightCluster = i % 5 === 0;
        const x = onRightCluster
          ? width * (0.68 + r1 * 0.34)
          : width * (Math.pow(r1, 1.45) * 0.78 - 0.04);
        const y = onRightCluster
          ? height * (0.04 + r2 * 0.55)
          : height * (0.14 + Math.pow(r2, 0.72) * 0.9);
        const angle = rand(i + 301) * Math.PI * 2;
        const speed = 0.14 + rand(i + 401) * 0.22;

        nodes.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + rand(i + 501) * 2.1,
          depth: 'near',
          hue: i % 3 === 0 ? 'teal' : 'blue',
        });
      }

      // Depth-blurred distant bokeh nodes
      for (let i = 0; i < farCount; i += 1) {
        const r1 = rand(i + 701);
        const r2 = rand(i + 801);
        const angle = rand(i + 901) * Math.PI * 2;
        const speed = 0.08 + rand(i + 1001) * 0.12;
        nodes.push({
          x: width * (Math.pow(r1, 1.25) * 0.85 - 0.05),
          y: height * (0.05 + r2 * 0.92),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + rand(i + 1101) * 3.5,
          depth: 'far',
          hue: 'teal',
        });
      }
    };

    const drawLayer = (depth: 'far' | 'near') => {
      const layerNodes = nodes.filter((n) => n.depth === depth);
      const maxDist = depth === 'far' ? Math.min(230, width * 0.22) : Math.min(185, width * 0.18);

      // Draw edges
      if (depth === 'far') {
        ctx.lineCap = 'round';
      }
      for (let i = 0; i < layerNodes.length; i += 1) {
        const a = layerNodes[i];
        for (let j = i + 1; j < layerNodes.length; j += 1) {
          const b = layerNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > maxDist) continue;

          const t = 1 - dist / maxDist;
          if (depth === 'far') {
            ctx.strokeStyle = `rgba(45, 169, 146, ${(t * 0.14).toFixed(3)})`;
            ctx.lineWidth = 3.2;
          } else {
            const isTeal = a.hue === 'teal' && b.hue === 'teal';
            ctx.strokeStyle = isTeal
              ? `rgba(0, 143, 167, ${(t * 0.34).toFixed(3)})`
              : `rgba(21, 94, 178, ${(t * 0.38).toFixed(3)})`;
            ctx.lineWidth = 0.8 + t * 0.55;
          }
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        // Subtle interactive pointer links for foreground layer
        if (depth === 'near' && pointer.active) {
          const pdx = a.x - pointer.x;
          const pdy = a.y - pointer.y;
          const pDist = Math.hypot(pdx, pdy);
          if (pDist < 170) {
            const pt = 1 - pDist / 170;
            ctx.strokeStyle = `rgba(0, 165, 195, ${(pt * 0.42).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Draw vertices
      for (const node of layerNodes) {
        if (depth === 'far') {
          const haloRadius = node.radius * 2.2;
          const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
          grad.addColorStop(0, 'rgba(69, 192, 178, 0.24)');
          grad.addColorStop(0.55, 'rgba(69, 192, 178, 0.08)');
          grad.addColorStop(1, 'rgba(69, 192, 178, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle =
            node.hue === 'teal' ? 'rgba(0, 143, 167, 0.62)' : 'rgba(14, 77, 164, 0.68)';
          ctx.fill();
        }

        if (depth === 'near' && node.radius > 2.4) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 2.4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 143, 167, 0.2)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    };

    const tick = () => {
      if (document.hidden) {
        rafId = 0;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < -60) node.x = width + 50;
          if (node.x > width + 60) node.x = -50;
          if (node.y < -60) node.y = height + 50;
          if (node.y > height + 60) node.y = -50;
        }
      }

      drawLayer('far');
      drawLayer('near');

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX - rectLeft;
      pointer.y = e.clientY - rectTop;
      pointer.active =
        pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !reducedMotion && !rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    initNodes();
    tick();

    const resizeObserver = new ResizeObserver(() => {
      initNodes();
      if (reducedMotion) tick();
    });
    resizeObserver.observe(container);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', syncBounds, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', syncBounds);
      window.removeEventListener('blur', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="imdx-backdrop-layer" aria-hidden="true">
      <div className="imdx-orb imdx-orb-a" />
      <div className="imdx-orb imdx-orb-b" />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
