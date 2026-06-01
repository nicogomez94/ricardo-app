import { useRef, useEffect, useCallback } from 'react';
import './PligoCanvas.css';

// Logical pliego dimensions (58cm × 100cm at 10px/cm)
const PLIGO_W = 580;
const PLIGO_H = 1000;
const GAP = 14;

function layoutItems(items) {
  const rows = [];
  let x = GAP;
  let y = GAP;
  let rowH = 0;
  const maxW = PLIGO_W - GAP * 2;

  for (const item of items) {
    const scale = Math.min(1, maxW / item.w);
    const dw = Math.round(item.w * scale);
    const dh = Math.round(item.h * scale);

    // Wrap to next row if doesn't fit
    if (x + dw > PLIGO_W - GAP && x > GAP) {
      x = GAP;
      y += rowH + GAP;
      rowH = 0;
    }

    rows.push({ x, y, w: dw, h: dh, dataUrl: item.dataUrl });
    x += dw + GAP;
    rowH = Math.max(rowH, dh);
  }

  return rows;
}

export default function PligoCanvas({ items }) {
  const canvasRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Black preview background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, PLIGO_W, PLIGO_H);

    if (!items.length) return;

    const positions = layoutItems(items);
    const loadImg = (src) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });

    Promise.all(items.map((it) => loadImg(it.dataUrl))).then((imgs) => {
      // Repaint bg in case of async race
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, PLIGO_W, PLIGO_H);
      imgs.forEach((img, i) => {
        const { x, y, w, h } = positions[i];
        ctx.drawImage(img, x, y, w, h);
      });
    });
  }, [items]);

  useEffect(() => {
    render();
  }, [render]);

  const handleExport = () => {
    const srcCanvas = canvasRef.current;
    if (!srcCanvas || !items.length) return;

    // Export with transparent background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = PLIGO_W;
    exportCanvas.height = PLIGO_H;
    const ctx = exportCanvas.getContext('2d');

    const positions = layoutItems(items);
    const loadImg = (src) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });

    Promise.all(items.map((it) => loadImg(it.dataUrl))).then((imgs) => {
      imgs.forEach((img, i) => {
        const { x, y, w, h } = positions[i];
        ctx.drawImage(img, x, y, w, h);
      });
      const url = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `pliego-dtf-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <div className="pligo-outer">
      {/* Toolbar */}
      <div className="pligo-toolbar">
        <div className="pligo-toolbar-info">
          <span className="pligo-toolbar-tag">DTF</span>
          <span className="pligo-toolbar-dim">58 cm × 100 cm · fondo transparente</span>
          {items.length > 0 && (
            <span className="pligo-toolbar-count">{items.length} imagen{items.length !== 1 ? 'es' : ''}</span>
          )}
        </div>
        <div className="pligo-toolbar-hint">
          <span className="pligo-hint-dot" />
          Vista con fondo negro para verificar transparencias
        </div>
        <button
          className="pligo-export-btn"
          onClick={handleExport}
          disabled={!items.length}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exportar pliego
        </button>
      </div>

      {/* Canvas area */}
      <div className="pligo-scroll-area">
        <div className="pligo-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={PLIGO_W}
            height={PLIGO_H}
            className="pligo-canvas"
          />
          {!items.length && (
            <div className="pligo-empty-overlay">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
                <path d="M24 18v12M18 24l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
              </svg>
              <p>Sin imágenes en el pliego</p>
              <span>Usá el panel izquierdo para agregar el resultado actual</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
