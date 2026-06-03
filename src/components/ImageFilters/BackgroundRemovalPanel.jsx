import './BackgroundRemovalPanel.css';

const SAMPLE_MODES = [
  { id: 'auto', label: 'Auto', desc: 'Bordes' },
  { id: 'white', label: 'Blanco', desc: 'Puro' },
];

function SliderRow({ label, value, min, max, unit = '%', onChange, leftLabel, rightLabel }) {
  return (
    <div className="bgr-ctrl-row">
      <div className="bgr-ctrl-header">
        <span className="bgr-ctrl-label">{label}</span>
        <span className="bgr-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="bgr-slider"
      />
      {(leftLabel || rightLabel) && (
        <div className="bgr-ctrl-range-labels">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

export default function BackgroundRemovalPanel({ settings, onSettingsChange }) {
  const {
    tolerance,
    softness = 12,
    edgeCleanup = 55,
    sampleMode = 'auto',
    removeInterior = true,
  } = settings;

  return (
    <div className="bgr-panel">
      <div className="panel-info">
        <span className="panel-info-icon">✂️</span>
        <p>Detecta el color del fondo desde los bordes y limpia halos suaves alrededor del diseño.</p>
      </div>

      <div className="bgr-section">
        <span className="bgr-ctrl-label">Color de fondo</span>
        <div className="bgr-mode-grid">
          {SAMPLE_MODES.map(mode => (
            <button
              key={mode.id}
              className={`bgr-mode-btn ${sampleMode === mode.id ? 'active' : ''}`}
              onClick={() => onSettingsChange('sampleMode', mode.id)}
            >
              <span className="bgr-mode-label">{mode.label}</span>
              <span className="bgr-mode-desc">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <SliderRow
        label="Tolerancia de color"
        value={tolerance}
        min={1}
        max={80}
        onChange={v => onSettingsChange('tolerance', v)}
        leftLabel="Preciso"
        rightLabel="Agresivo"
      />

      <SliderRow
        label="Suavidad de borde"
        value={softness}
        min={0}
        max={60}
        onChange={v => onSettingsChange('softness', v)}
        leftLabel="Corte seco"
        rightLabel="Suave"
      />

      <SliderRow
        label="Limpieza de halo"
        value={edgeCleanup}
        min={0}
        max={100}
        onChange={v => onSettingsChange('edgeCleanup', v)}
        leftLabel="Natural"
        rightLabel="Limpio"
      />

      <label className="bgr-toggle-row">
        <span className="bgr-toggle-label">Huecos internos</span>
        <button
          className={`bgr-toggle-btn ${removeInterior ? 'active' : ''}`}
          onClick={() => onSettingsChange('removeInterior', !removeInterior)}
          type="button"
        >
          {removeInterior ? 'ON' : 'OFF'}
        </button>
      </label>

      <div className="bgr-hint-box">
        <div className="bgr-hint-title">Resultado sobre fondo cuadriculado</div>
        <div className="bgr-checkerboard-demo">
          <div className="bgr-checker-text">Vista previa con transparencia</div>
        </div>
        <p className="bgr-hint-text">
          El modo Auto toma muestras del borde de la imagen para detectar fondos blancos, off-white o de color plano.
        </p>
      </div>

      <div className="bgr-tip">
        <strong>Consejo:</strong> apagá Huecos internos cuando el diseño tenga blancos que deban conservarse.
      </div>
    </div>
  );
}
