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

export default function ImageEnhancementPanel({ settings, onSettingsChange }) {
  const { brightness, contrast, saturation } = settings;

  return (
    <div className="enh-panel">
      <div className="panel-info">
        <span className="panel-info-icon">💡</span>
        <p>Ajuste básico de imagen para optimizar visibilidad del diseño antes de aplicar efectos.</p>
      </div>

      <SliderRow
        label="Brillo"
        value={brightness}
        min={20}
        max={200}
        onChange={v => onSettingsChange('brightness', v)}
        leftLabel="Oscuro"
        rightLabel="Luminoso"
      />
      <SliderRow
        label="Contraste"
        value={contrast}
        min={20}
        max={300}
        onChange={v => onSettingsChange('contrast', v)}
        leftLabel="Suave"
        rightLabel="Marcado"
      />
      <SliderRow
        label="Saturación"
        value={saturation}
        min={0}
        max={300}
        onChange={v => onSettingsChange('saturation', v)}
        leftLabel="Gris"
        rightLabel="Vívido"
      />

      <div className="panel-reset">
        <button
          className="btn-ghost"
          onClick={() => {
            onSettingsChange('brightness', 100);
            onSettingsChange('contrast', 100);
            onSettingsChange('saturation', 100);
          }}
        >
          ↺ Resetear valores
        </button>
      </div>

      <div className="panel-note">
        Esta herramienta aplica ajustes CSS estándar. No es reconstrucción profesional con IA.
      </div>
    </div>
  );
}
