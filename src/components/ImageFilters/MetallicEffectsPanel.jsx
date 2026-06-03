import './MetallicEffectsPanel.css';

const VARIANTS = [
  {
    id: 'gold',
    label: 'Dorado',
    desc: 'Oro cálido clásico',
    gradient: 'linear-gradient(135deg, #160a00, #533000, #e2a81f, #fff0a6, #b87308, #160a00)',
  },
  {
    id: 'silver',
    label: 'Plateado',
    desc: 'Plata fría refinada',
    gradient: 'linear-gradient(135deg, #11131a, #343947, #c3c8d1, #ffffff, #8e96a3, #11131a)',
  },
  {
    id: 'copper',
    label: 'Cobre',
    desc: 'Bronce oxidado cálido',
    gradient: 'linear-gradient(135deg, #170602, #5b1b0b, #d06d34, #ffd09a, #a94720, #170602)',
  },
  {
    id: 'chrome',
    label: 'Cromado',
    desc: 'Espejo industrial',
    gradient: 'linear-gradient(135deg, #07101d, #163060, #2f78d0, #ffffff, #3d8bf0, #07101d)',
  },
];

const DEFAULT_TRAMA = {
  bandSize: 62,
  bandIntensity: 46,
  shine: 68,
  texture: 14,
  angle: 12,
};

function SliderRow({ label, value, min, max, unit = '%', step = 1, onChange, leftLabel, rightLabel }) {
  return (
    <div className="met-ctrl-row">
      <div className="met-ctrl-header">
        <span className="met-ctrl-label">{label}</span>
        <span className="met-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="met-slider"
      />
      {(leftLabel || rightLabel) && (
        <div className="met-ctrl-range-labels">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

export default function MetallicEffectsPanel({ settings, onSettingsChange }) {
  const {
    variant,
    bandSize = DEFAULT_TRAMA.bandSize,
    bandIntensity = DEFAULT_TRAMA.bandIntensity,
    shine = DEFAULT_TRAMA.shine,
    texture = DEFAULT_TRAMA.texture,
    angle = DEFAULT_TRAMA.angle,
  } = settings;

  const handleResetTrama = () => {
    Object.entries(DEFAULT_TRAMA).forEach(([key, value]) => onSettingsChange(key, value));
  };

  return (
    <div className="met-panel">
      <div className="panel-info">
        <span className="panel-info-icon">✦</span>
        <p>Simula acabados metálicos con bandas de brillo, color propio y relieve tonal. Ideal para propuestas comerciales de textil.</p>
      </div>

      <div className="met-label">Variante metálica</div>
      <div className="met-grid">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            className={`met-card ${variant === v.id ? 'active' : ''}`}
            onClick={() => onSettingsChange('variant', v.id)}
          >
            <div
              className="met-swatch"
              style={{ background: v.gradient }}
            >
              <div className="met-swatch-shine" />
            </div>
            <div className="met-card-info">
              <span className="met-card-name">{v.label}</span>
              <span className="met-card-desc">{v.desc}</span>
            </div>
            {variant === v.id && <span className="met-card-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="met-divider" />

      <div className="met-label">Trama y brillo</div>
      <SliderRow
        label="Tamaño de trama"
        value={bandSize}
        min={20}
        max={100}
        onChange={v => onSettingsChange('bandSize', v)}
        leftLabel="Fina"
        rightLabel="Amplia"
      />
      <SliderRow
        label="Intensidad"
        value={bandIntensity}
        min={0}
        max={100}
        onChange={v => onSettingsChange('bandIntensity', v)}
        leftLabel="Limpia"
        rightLabel="Marcada"
      />
      <SliderRow
        label="Brillo espejo"
        value={shine}
        min={0}
        max={100}
        onChange={v => onSettingsChange('shine', v)}
        leftLabel="Mate"
        rightLabel="Espejo"
      />
      <SliderRow
        label="Textura fina"
        value={texture}
        min={0}
        max={100}
        onChange={v => onSettingsChange('texture', v)}
        leftLabel="Lisa"
        rightLabel="Rayada"
      />
      <SliderRow
        label="Dirección"
        value={angle}
        min={-45}
        max={45}
        unit="°"
        onChange={v => onSettingsChange('angle', v)}
        leftLabel="Diagonal izq."
        rightLabel="Diagonal der."
      />

      <button className="met-reset-btn" onClick={handleResetTrama}>
        ↺ Resetear trama
      </button>

      <div className="met-note">
        El acabado recolorea la imagen según la variante elegida. Funciona mejor con imágenes con contraste definido.
      </div>
    </div>
  );
}
