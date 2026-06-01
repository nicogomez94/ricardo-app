import './HalftonePanel.css';

const SHAPES = [
  { id: 'circle',  label: 'Círculo',  icon: '●' },
  { id: 'square',  label: 'Cuadrado', icon: '■' },
  { id: 'diamond', label: 'Rombo',    icon: '◆' },
  { id: 'line',    label: 'Línea',    icon: '≡' },
];

function SliderRow({ label, value, min, max, unit = '', step = 1, onChange }) {
  return (
    <div className="ht-ctrl-row">
      <div className="ht-ctrl-header">
        <span className="ht-ctrl-label">{label}</span>
        <span className="ht-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ht-slider"
      />
    </div>
  );
}

export default function HalftonePanel({ settings, onSettingsChange }) {
  const { dotSize, density, contrast, invert, garmentMode, angle = 45, shape = 'circle' } = settings;

  return (
    <div className="ht-panel">
      <div className="panel-info">
        <span className="panel-info-icon">⬤</span>
        <p>Simula trama de semitono para serigrafía. Ideal para diseños en escala de grises.</p>
      </div>

      {/* Shape selector */}
      <div className="ht-section">
        <span className="ht-ctrl-label">Forma del punto</span>
        <div className="ht-shape-grid">
          {SHAPES.map(s => (
            <button
              key={s.id}
              className={`ht-shape-btn ${shape === s.id ? 'active' : ''}`}
              onClick={() => onSettingsChange('shape', s.id)}
            >
              <span className="ht-shape-icon">{s.icon}</span>
              <span className="ht-shape-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <SliderRow
        label="Ángulo de trama"
        value={angle}
        min={0}
        max={90}
        unit="°"
        onChange={v => onSettingsChange('angle', v)}
      />
      <SliderRow
        label="Tamaño de punto"
        value={dotSize}
        min={2}
        max={24}
        unit="px"
        onChange={v => onSettingsChange('dotSize', v)}
      />
      <SliderRow
        label="Densidad"
        value={density}
        min={20}
        max={100}
        unit="%"
        onChange={v => onSettingsChange('density', v)}
      />
      <SliderRow
        label="Contraste previo"
        value={contrast}
        min={50}
        max={400}
        unit="%"
        onChange={v => onSettingsChange('contrast', v)}
      />

      <div className="ht-toggles">
        <label className="ht-toggle-row">
          <span className="ht-toggle-label">Invertir brillo</span>
          <button
            className={`ht-toggle-btn ${invert ? 'active' : ''}`}
            onClick={() => onSettingsChange('invert', !invert)}
          >
            {invert ? 'ON' : 'OFF'}
          </button>
        </label>
      </div>

      <div className="ht-garment-selector">
        <span className="ht-garment-label">Modo prenda</span>
        <div className="ht-garment-options">
          <button
            className={`ht-garment-btn light ${garmentMode === 'light' ? 'active' : ''}`}
            onClick={() => onSettingsChange('garmentMode', 'light')}
          >
            <span className="ht-garment-preview light-preview" />
            Prenda clara
          </button>
          <button
            className={`ht-garment-btn dark ${garmentMode === 'dark' ? 'active' : ''}`}
            onClick={() => onSettingsChange('garmentMode', 'dark')}
          >
            <span className="ht-garment-preview dark-preview" />
            Prenda oscura
          </button>
        </div>
      </div>
    </div>
  );
}
