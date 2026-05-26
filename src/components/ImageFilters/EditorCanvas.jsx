import { useRef, useState } from 'react';
import './EditorCanvas.css';

export default function EditorCanvas({
  originalUrl,
  processedUrl,
  viewMode,
  onViewModeChange,
  activeFilter,
}) {
  const [comparePos, setComparePos] = useState(50);
  const containerRef = useRef(null);

  const isCheckerboard = activeFilter === 'bgremoval';

  const handleCompareMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    setComparePos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  };

  return (
    <div className="editor-canvas">
      {/* View mode controls */}
      {originalUrl && (
        <div className="canvas-view-controls">
          <div className="view-mode-group">
            {[
              { id: 'original', label: 'Original' },
              { id: 'processed', label: 'Resultado' },
              { id: 'compare', label: '◫ Comparar' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`view-mode-btn ${viewMode === id ? 'active' : ''}`}
                onClick={() => onViewModeChange(id)}
                disabled={id === 'processed' && !processedUrl}
              >
                {label}
              </button>
            ))}
          </div>
          {viewMode === 'compare' && (
            <span className="compare-hint">← Arrastrá para comparar →</span>
          )}
        </div>
      )}

      {/* Canvas area */}
      <div className="canvas-display-area">
        {!originalUrl ? (
          <div className="canvas-empty-state">
            <div className="canvas-empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="14" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"/>
                <circle cx="22" cy="26" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 38 L20 28 L30 36 L42 24 L56 38" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="canvas-empty-title">Sin imagen</p>
            <p className="canvas-empty-sub">Subí una imagen desde el panel izquierdo para comenzar.</p>
          </div>
        ) : viewMode === 'compare' && processedUrl ? (
          // Split comparison view
          <div
            className="compare-container"
            ref={containerRef}
            onMouseMove={handleCompareMove}
            onTouchMove={handleCompareMove}
          >
            <img src={originalUrl} className="compare-img compare-before" alt="Original" />
            <div
              className="compare-after-clip"
              style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
            >
              <img
                src={processedUrl}
                className={`compare-img compare-after ${isCheckerboard ? 'checkerboard-bg' : ''}`}
                alt="Resultado"
              />
            </div>
            <div className="compare-divider" style={{ left: `${comparePos}%` }}>
              <div className="compare-handle">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={comparePos}
              onChange={e => setComparePos(Number(e.target.value))}
              className="compare-range-input"
            />
            <div className="compare-tag compare-tag-before">ANTES</div>
            <div className="compare-tag compare-tag-after">DESPUÉS</div>
          </div>
        ) : viewMode === 'processed' && processedUrl ? (
          <div className={`single-image-view ${isCheckerboard ? 'checkerboard-bg' : ''}`}>
            <img src={processedUrl} alt="Resultado" className="display-img" />
          </div>
        ) : (
          <div className="single-image-view">
            <img src={originalUrl} alt="Original" className="display-img" />
          </div>
        )}
      </div>

      {/* Side-by-side when both exist, as extra info row */}
      {originalUrl && processedUrl && viewMode !== 'compare' && (
        <div className="canvas-meta-bar">
          <span className="canvas-meta-label">
            {viewMode === 'processed' ? '✓ Mostrando resultado del filtro' : '◎ Mostrando imagen original'}
          </span>
          <button className="canvas-meta-switch" onClick={() => onViewModeChange(viewMode === 'processed' ? 'original' : 'processed')}>
            {viewMode === 'processed' ? 'Ver original' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}
