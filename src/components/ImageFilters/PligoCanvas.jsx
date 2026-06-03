import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  PLIGO_EXPORT_SCALE,
  PLIGO_HEIGHT,
  PLIGO_PX_PER_CM,
  PLIGO_WIDTH,
  formatPligoCm,
  layoutPligoItems,
} from '../../utils/pligoLayout.js';
import './PligoCanvas.css';

const EMPTY_SHEET = {
  index: 0,
  items: [],
  usedArea: 0,
  usedHeight: 0,
  remainingHeight: PLIGO_HEIGHT,
  efficiency: 0,
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawPreviewBackground(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, PLIGO_WIDTH, PLIGO_HEIGHT);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';

  const gridStep = PLIGO_PX_PER_CM * 10;
  for (let x = gridStep; x < PLIGO_WIDTH; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, PLIGO_HEIGHT);
    ctx.stroke();
  }

  for (let y = gridStep; y < PLIGO_HEIGHT; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(PLIGO_WIDTH, y + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(74,222,128,0.32)';
  ctx.strokeRect(0.5, 0.5, PLIGO_WIDTH - 1, PLIGO_HEIGHT - 1);
  ctx.restore();
}

async function renderSheet(canvas, sheet, { preview = false, scale = 1, isActive = () => true } = {}) {
  canvas.width = PLIGO_WIDTH * scale;
  canvas.height = PLIGO_HEIGHT * scale;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (preview) {
    drawPreviewBackground(ctx);
  } else {
    ctx.clearRect(0, 0, PLIGO_WIDTH, PLIGO_HEIGHT);
  }

  if (!sheet.items.length) return;

  const images = await Promise.all(sheet.items.map((item) => loadImage(item.dataUrl)));
  if (!isActive()) return;

  if (preview) {
    drawPreviewBackground(ctx);
  } else {
    ctx.clearRect(0, 0, PLIGO_WIDTH, PLIGO_HEIGHT);
  }

  images.forEach((img, index) => {
    if (!img) return;
    const item = sheet.items[index];
    ctx.drawImage(img, item.x, item.y, item.w, item.h);
  });
}

function downloadCanvas(canvas, filename) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function PligoSheetCanvas({ sheet, isEmpty }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (canvasRef.current) {
      renderSheet(canvasRef.current, sheet, {
        preview: true,
        isActive: () => active,
      });
    }

    return () => {
      active = false;
    };
  }, [sheet]);

  return (
    <div className="pligo-sheet">
      <div className="pligo-sheet-header">
        <span>Pliego {sheet.index + 1}</span>
        {!isEmpty && (
          <span>
            {sheet.items.length} diseño{sheet.items.length !== 1 ? 's' : ''} · {Math.round(sheet.efficiency)}% uso · {formatPligoCm(sheet.remainingHeight)} cm libres
          </span>
        )}
      </div>
      <div className="pligo-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={PLIGO_WIDTH}
          height={PLIGO_HEIGHT}
          className="pligo-canvas"
        />
        {isEmpty && (
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
  );
}

export default function PligoCanvas({ items }) {
  const [isExporting, setIsExporting] = useState(false);
  const layout = useMemo(() => layoutPligoItems(items), [items]);
  const visibleSheets = layout.sheets.length ? layout.sheets : [EMPTY_SHEET];
  const sheetCount = Math.max(1, layout.sheetCount);
  const lastSheet = layout.sheets[layout.sheets.length - 1];
  const exportPixels = `${PLIGO_WIDTH * PLIGO_EXPORT_SCALE} × ${PLIGO_HEIGHT * PLIGO_EXPORT_SCALE}px`;

  const handleExport = useCallback(async () => {
    if (!items.length || isExporting) return;
    setIsExporting(true);

    try {
      for (let i = 0; i < layout.sheets.length; i += 1) {
        const sheet = layout.sheets[i];
        const canvas = document.createElement('canvas');
        await renderSheet(canvas, sheet, { scale: PLIGO_EXPORT_SCALE });
        const suffix = layout.sheets.length > 1 ? `-${i + 1}-de-${layout.sheets.length}` : '';
        downloadCanvas(canvas, `pliego-dtf${suffix}-${Date.now()}.png`);

        if (i < layout.sheets.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
        }
      }
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, items.length, layout.sheets]);

  return (
    <div className="pligo-outer">
      <div className="pligo-toolbar">
        <div className="pligo-toolbar-info">
          <span className="pligo-toolbar-tag">DTF</span>
          <span className="pligo-toolbar-dim">58 cm × 100 cm · export {exportPixels}</span>
          {items.length > 0 && (
            <>
              <span className="pligo-toolbar-count">{items.length} imagen{items.length !== 1 ? 'es' : ''}</span>
              <span className="pligo-toolbar-count">{sheetCount} pliego{sheetCount !== 1 ? 's' : ''}</span>
              <span className="pligo-toolbar-count">{Math.round(layout.efficiency)}% ocupado</span>
              {lastSheet && (
                <span className="pligo-toolbar-count">{formatPligoCm(lastSheet.remainingHeight)} cm libres</span>
              )}
            </>
          )}
        </div>
        <div className="pligo-toolbar-hint">
          <span className="pligo-hint-dot" />
          Vista negra con grilla; exporta transparente
        </div>
        <button
          className="pligo-export-btn"
          onClick={handleExport}
          disabled={!items.length || isExporting}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isExporting ? 'Exportando...' : `Exportar ${sheetCount} pliego${sheetCount !== 1 ? 's' : ''}`}
        </button>
      </div>

      <div className="pligo-scroll-area">
        <div className="pligo-sheet-stack">
          {visibleSheets.map((sheet) => (
            <PligoSheetCanvas
              key={sheet.index}
              sheet={sheet}
              isEmpty={!items.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
