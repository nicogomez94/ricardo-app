import './Panel.css';

const EFFECTS = [
  {
    id: 'outline',
    label: 'Outline',
    description: 'Borde blanco alrededor del texto',
    changes: { strokeWidth: 3, stroke: '#ffffff' },
  },
  {
    id: 'shadow',
    label: 'Sombra',
    description: 'Sombra oscura bajo el texto',
    changes: {
      shadowColor: '#000000',
      shadowBlur: 12,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
    },
  },
  {
    id: 'glow',
    label: 'Glow',
    description: 'Resplandor de color',
    changes: {
      shadowColor: '#ff6b6b',
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  },
];

export default function EffectsPanel({ element, onUpdate, showTexture, setShowTexture }) {
  const applyEffect = (effect) => {
    if (!element) return;
    onUpdate(effect.changes);
  };

  return (
    <div className="panel">
      <h3 className="panel-title">Efectos</h3>

      <div className="effects-list">
        {EFFECTS.map((eff) => (
          <button
            key={eff.id}
            className="effect-btn"
            onClick={() => applyEffect(eff)}
            disabled={!element}
          >
            <span className="effect-name">{eff.label}</span>
            <span className="effect-desc">{eff.description}</span>
          </button>
        ))}
      </div>

      <div className="divider" />
      <h4 className="panel-subtitle">Overlay de textura</h4>
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={showTexture}
          onChange={(e) => setShowTexture(e.target.checked)}
        />
        <span>Activar textura sobre canvas</span>
      </label>

      {!element && (
        <p className="panel-hint" style={{ marginTop: '12px' }}>
          Seleccioná un texto para aplicar efectos.
        </p>
      )}
    </div>
  );
}
