import { useState } from 'react';
import './ImageEnhancementPanel.css';

function SliderRow({ label, value, min, max, unit = '%', step = 1, onChange, leftLabel, rightLabel }) {
  return (
    <div className="enh-ctrl-row">
      <div className="enh-ctrl-header">
        <span className="enh-ctrl-label">{label}</span>
        <span className="enh-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="enh-slider"
      />
      {(leftLabel || rightLabel) && (
        <div className="enh-ctrl-range-labels">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

const EXPORT_QUALITY = [
  { id: 'normal', label: 'Normal', desc: '1× — pantalla', icon: '◻' },
  { id: 'hd',     label: 'HD',     desc: '2× — alta def',  icon: '◼' },
  { id: 'print',  label: '~300 DPI', desc: '3× — impresión', icon: '★' },
];

export default function ImageEnhancementPanel({ settings, onSettingsChange, onApply, workingDimensions }) {
  const {
    brightness, contrast, saturation,
    scale, vectorize, vectorThreshold, vectorColor,
    exportQuality,
  } = settings;

  const [vectorOpen, setVectorOpen] = useState(vectorize);

  const outW = workingDimensions ? Math.round(workingDimensions.w * scale / 100) : null;
  const outH = workingDimensions ? Math.round(workingDimensions.h * scale / 100) : null;

  const handleVectorToggle = () => {
    const next = !vectorize;
    setVectorOpen(next);
    onSettingsChange('vectorize', next);
  };

  const handleReset = () => {
    onSettingsChange('brightness', 100);
    onSettingsChange('contrast', 100);
    onSettingsChange('saturation', 100);
    onSettingsChange('scale', 100);
    onSettingsChange('vectorize', false);
    onSettingsChange('vectorThreshold', 128);
    onSettingsChange('vectorColor', '#000000');
    setVectorOpen(false);
  };

  return (
    <div className="enh-panel">

      {/* ── Ajustes básicos ─────────────────────────── */}
      <div className="enh-section-title">Ajustes básicos</div>

      <SliderRow
        label="Brillo"
        value={brightness}
        min={20} max={220}
        onChange={v => onSettingsChange('brightness', v)}
        leftLabel="Oscuro"
        rightLabel="Luminoso"
      />
      <SliderRow
        label="Contraste"
        value={contrast}
        min={20} max={300}
        onChange={v => onSettingsChange('contrast', v)}
        leftLabel="Suave"
        rightLabel="Marcado"
      />
      <SliderRow
        label="Saturación"
        value={saturation}
        min={0} max={300}
        onChange={v => onSettingsChange('saturation', v)}
        leftLabel="Sin color"
        rightLabel="Vívido"
      />

      <div className="enh-divider" />

      {/* ── Tamaño / Escala ──────────────────────────── */}
      <div className="enh-section-title">Tamaño / Escala</div>

      <SliderRow
        label="Escala de imagen"
        value={scale}
        min={25} max={300}
        unit="%"
        onChange={v => onSettingsChange('scale', v)}
        leftLabel="Pequeño"
        rightLabel="Grande"
      />

      {outW && outH && (
        <div className="enh-dimensions">
          <span className="enh-dim-icon">⬡</span>
          <span>Salida: <strong>{outW} × {outH} px</strong></span>
          {scale >= 200 && (
            <span className="enh-dim-badge">Alta resolución</span>
          )}
        </div>
      )}

      <div className="enh-scale-presets">
        <span className="enh-preset-label">Acceso rápido:</span>
        {[
          { label: '100%', val: 100 },
          { label: '150%', val: 150 },
          { label: '200% HD', val: 200 },
          { label: '300% ~300 DPI', val: 300 },
        ].map(p => (
          <button
            key={p.val}
            className={`enh-preset-btn ${scale === p.val ? 'active' : ''}`}
            onClick={() => onSettingsChange('scale', p.val)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="enh-divider" />

      {/* ── Calidad de exportación ──────────────────── */}
      <div className="enh-section-title">Calidad de exportación</div>
      <div className="enh-quality-grid">
        {EXPORT_QUALITY.map(q => (
          <button
            key={q.id}
            className={`enh-quality-btn ${exportQuality === q.id ? 'active' : ''}`}
            onClick={() => onSettingsChange('exportQuality', q.id)}
          >
            <span className="enh-quality-icon">{q.icon}</span>
            <span className="enh-quality-label">{q.label}</span>
            <span className="enh-quality-desc">{q.desc}</span>
          </button>
        ))}
      </div>
      <p className="enh-quality-note">
        "300 DPI" escala el archivo 3× al exportar. No reconstruye detalle si la imagen original es pequeña o borrosa.
      </p>

      <div className="enh-divider" />

      {/* ── Vectorización básica ─────────────────────── */}
      <button className="enh-section-toggle" onClick={handleVectorToggle}>
        <span className="enh-section-title" style={{ margin: 0 }}>Vectorización básica</span>
        <span className={`enh-toggle-arrow ${vectorOpen ? 'open' : ''}`}>›</span>
        {vectorize && <span className="enh-active-badge">ON</span>}
      </button>

      {vectorOpen && (
        <div className="enh-vector-section">
          <div className="panel-info" style={{ marginBottom: 12 }}>
            <span className="panel-info-icon">✦</span>
            <p>Aplana la imagen a formas sólidas con un umbral de luminosidad. Ideal para logos y diseños de alto contraste sobre fondo blanco.</p>
          </div>

          <label className="enh-vector-enable">
            <input
              type="checkbox"
              checked={vectorize}
              onChange={handleVectorToggle}
            />
            <span>Activar vectorización</span>
          </label>

          {vectorize && (
            <>
              <SliderRow
                label="Umbral"
                value={vectorThreshold}
                min={10} max={245}
                unit=""
                onChange={v => onSettingsChange('vectorThreshold', v)}
                leftLabel="Más oscuro"
                rightLabel="Más claro"
              />
              <div className="enh-ctrl-row">
                <div className="enh-ctrl-header">
                  <span className="enh-ctrl-label">Color del trazo</span>
                </div>
                <div className="enh-color-row">
                  <input
                    type="color"
                    value={vectorColor}
                    onChange={e => onSettingsChange('vectorColor', e.target.value)}
                    className="enh-color-picker"
                  />
                  <span className="enh-color-value">{vectorColor.toUpperCase()}</span>
                  {['#000000', '#ffffff', '#cc0000', '#0044cc', '#006600'].map(c => (
                    <button
                      key={c}
                      className={`enh-color-swatch ${vectorColor === c ? 'active' : ''}`}
                      style={{ background: c, border: c === '#ffffff' ? '1px solid #555' : 'none' }}
                      onClick={() => onSettingsChange('vectorColor', c)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="enh-divider" />

      {/* ── Acciones ────────────────────────────────── */}
      <div className="enh-actions">
        <button className="btn-ghost" onClick={handleReset}>
          ↺ Resetear
        </button>
        {onApply && (
          <button className="enh-apply-btn" onClick={onApply}>
            ✓ Aplicar mejora
          </button>
        )}
      </div>

      <div className="panel-note">
        Ajustes de mejora básica. No es reconstrucción con IA: la calidad depende del archivo original.
      </div>
    </div>
  );
}
