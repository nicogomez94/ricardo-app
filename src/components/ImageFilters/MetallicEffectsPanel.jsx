import './MetallicEffectsPanel.css';

const VARIANTS = [
  {
    id: 'gold',
    label: 'Dorado',
    desc: 'Oro cálido clásico',
    gradient: 'linear-gradient(135deg, #7a4a00, #c08010, #f5d060, #c08010, #7a4a00)',
  },
  {
    id: 'silver',
    label: 'Plateado',
    desc: 'Plata fría refinada',
    gradient: 'linear-gradient(135deg, #565668, #9898b0, #f4f4fc, #9898b0, #565668)',
  },
  {
    id: 'copper',
    label: 'Cobre',
    desc: 'Bronce oxidado cálido',
    gradient: 'linear-gradient(135deg, #6b2010, #a84520, #f0a060, #a84520, #6b2010)',
  },
  {
    id: 'chrome',
    label: 'Cromado',
    desc: 'Espejo industrial',
    gradient: 'linear-gradient(135deg, #2040a0, #4878d4, #e0f0ff, #4878d4, #2040a0)',
  },
];

export default function MetallicEffectsPanel({ settings, onSettingsChange }) {
  const { variant } = settings;

  return (
    <div className="met-panel">
      <div className="panel-info">
        <span className="panel-info-icon">✦</span>
        <p>Simula acabados metálicos usando gradientes y blend modes. Ideal para propuestas comerciales de textil.</p>
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

      <div className="met-note">
        El efecto se aplica como overlay sobre la imagen original. Funciona mejor con imágenes con contraste definido.
      </div>
    </div>
  );
}
