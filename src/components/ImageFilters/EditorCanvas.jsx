import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva';
import './EditorCanvas.css';

function useLoadedImage(src) {
  const [loaded, setLoaded] = useState({ src: null, image: null });

  useEffect(() => {
    if (!src) return undefined;

    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setLoaded({ src, image: img });
    };
    img.src = src;

    return () => {
      active = false;
    };
  }, [src]);

  return loaded.image;
}

function useElementSize(ref) {
  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function createCheckerPattern() {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#cfd3dc';
  ctx.fillRect(0, 0, 24, 24);
  ctx.fillStyle = '#8b92a3';
  ctx.fillRect(0, 0, 12, 12);
  ctx.fillRect(12, 12, 12, 12);
  return canvas;
}

function getImageLayout(image, stageSize) {
  if (!image) return null;
  const maxW = stageSize.width;
  const maxH = stageSize.height;
  const scale = Math.min(1, maxW / image.width, maxH / image.height);
  const width = Math.max(1, image.width * scale);
  const height = Math.max(1, image.height * scale);

  return {
    x: (maxW - width) / 2,
    y: (maxH - height) / 2,
    width,
    height,
  };
}

function Checkerboard({ width, height, pattern }) {
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fillPatternImage={pattern}
      fillPatternRepeat="repeat"
      listening={false}
    />
  );
}

function ImageLayer({ image, layout }) {
  if (!image || !layout) return null;

  return (
    <KonvaImage
      image={image}
      x={layout.x}
      y={layout.y}
      width={layout.width}
      height={layout.height}
      listening={false}
    />
  );
}

function KonvaWorkbench({
  originalImage,
  processedImage,
  viewMode,
  comparePos,
  stageSize,
  showCheckerboard,
}) {
  const checkerPattern = useMemo(() => createCheckerPattern(), []);
  const displayImage = viewMode === 'processed' && processedImage ? processedImage : originalImage;
  const displayLayout = getImageLayout(displayImage, stageSize);
  const originalLayout = getImageLayout(originalImage, stageSize);
  const processedLayout = getImageLayout(processedImage, stageSize);
  const compareX = (stageSize.width * comparePos) / 100;

  return (
    <Stage width={stageSize.width} height={stageSize.height}>
      <Layer>
        {showCheckerboard && (
          <Checkerboard
            width={stageSize.width}
            height={stageSize.height}
            pattern={checkerPattern}
          />
        )}

        {viewMode === 'compare' && processedImage ? (
          <>
            <ImageLayer image={originalImage} layout={originalLayout} />
            <Group
              clipFunc={(ctx) => {
                ctx.rect(0, 0, compareX, stageSize.height);
              }}
            >
              <ImageLayer image={processedImage} layout={processedLayout} />
            </Group>
            <Line
              points={[compareX, 0, compareX, stageSize.height]}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={2}
              listening={false}
            />
            <Circle
              x={compareX}
              y={stageSize.height / 2}
              radius={18}
              fill="rgba(255,255,255,0.96)"
              stroke="#6366f1"
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.45)"
              shadowBlur={12}
              listening={false}
            />
          </>
        ) : (
          <ImageLayer image={displayImage} layout={displayLayout} />
        )}
      </Layer>
    </Stage>
  );
}

export default function EditorCanvas({
  originalUrl,
  processedUrl,
  viewMode,
  onViewModeChange,
  activeFilter,
  imageMeta,
}) {
  const [comparePos, setComparePos] = useState(50);
  const stageAreaRef = useRef(null);
  const stageSize = useElementSize(stageAreaRef);
  const originalImage = useLoadedImage(originalUrl);
  const processedImage = useLoadedImage(processedUrl);
  const isCheckerboard = activeFilter === 'bgremoval' || activeFilter === 'halftone' || activeFilter === 'puff';

  const handleCompareMove = (e) => {
    if (!stageAreaRef.current) return;
    const rect = stageAreaRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX == null) return;
    const x = clientX - rect.left;
    setComparePos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  };

  return (
    <div className="editor-canvas">
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

      <div
        className="canvas-display-area"
        ref={stageAreaRef}
        onMouseMove={viewMode === 'compare' ? handleCompareMove : undefined}
        onTouchMove={viewMode === 'compare' ? handleCompareMove : undefined}
      >
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
        ) : (
          <>
            <div className="konva-stage-shell">
              <KonvaWorkbench
                originalImage={originalImage}
                processedImage={processedImage}
                viewMode={viewMode}
                comparePos={comparePos}
                stageSize={stageSize}
                showCheckerboard={isCheckerboard}
              />
            </div>
            {viewMode === 'compare' && processedUrl && (
              <>
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
              </>
            )}
          </>
        )}
      </div>

      {originalUrl && processedUrl && viewMode !== 'compare' && (
        <div className="canvas-meta-bar">
          <span className="canvas-meta-label">
            {viewMode === 'processed' ? '✓ Mostrando resultado del filtro' : '◎ Mostrando imagen base'}
          </span>
          {imageMeta?.export && (
            <span className="canvas-meta-dims">
              Export: {imageMeta.export.w} × {imageMeta.export.h}px
              {imageMeta.preview && ` · Preview: ${imageMeta.preview.w} × ${imageMeta.preview.h}px`}
            </span>
          )}
          <button className="canvas-meta-switch" onClick={() => onViewModeChange(viewMode === 'processed' ? 'original' : 'processed')}>
            {viewMode === 'processed' ? 'Ver base' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}
