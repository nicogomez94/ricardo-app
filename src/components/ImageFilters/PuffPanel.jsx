import './PuffPanel.css';

function SliderRow({ label, value, min, max, unit = '', step = 1, onChange }) {
  return (
    <div className="puff-ctrl-row">
      <div className="puff-ctrl-header">
        <span className="puff-ctrl-label">{label}</span>
        <span className="puff-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="puff-slider"
      />
    </div>
  );
}

const EXPORT_QUALITY = [
  { id: 'normal', label: 'Normal', desc: '1×' },
  { id: 'hd', label: 'HD', desc: '2×' },
  { id: 'print', label: '~300 DPI', desc: '3×' },
];

export default function PuffPanel({ settings, onSettingsChange }) {
  const {
    depth = 18,
    highlightOpacity = 72,
    outlineWidth = 5,
    stickerBorder = 4,
    solidify = 74,
    exportQuality = 'print',
  } = settings;

  return (
    <div className="puff-panel">
      <div className="panel-info">
        <span className="panel-info-icon">🫧</span>
        <p>Relieve inflado con formas engrosadas, colores sólidos, contornos definidos y fondo transparente para DTF.</p>
      </div>

      <SliderRow
        label="Volumen puff"
        value={depth}
        min={4}
        max={36}
        onChange={v => onSettingsChange('depth', v)}
      />
      <SliderRow
        label="Luces marcadas"
        value={highlightOpacity}
        min={0}
        max={100}
        unit="%"
        onChange={v => onSettingsChange('highlightOpacity', v)}
      />
      <SliderRow
        label="Contorno"
        value={outlineWidth}
        min={0}
        max={18}
        onChange={v => onSettingsChange('outlineWidth', v)}
      />
      <SliderRow
        label="Borde sticker"
        value={stickerBorder}
        min={0}
        max={24}
        onChange={v => onSettingsChange('stickerBorder', v)}
      />
      <SliderRow
        label="Color sólido"
        value={solidify}
        min={0}
        max={100}
        unit="%"
        onChange={v => onSettingsChange('solidify', v)}
      />

      <div className="puff-quality-row">
        <span className="puff-quality-title">Exportación</span>
        <div className="puff-quality-grid">
          {EXPORT_QUALITY.map(q => (
            <button
              key={q.id}
              className={`puff-quality-btn ${exportQuality === q.id ? 'active' : ''}`}
              onClick={() => onSettingsChange('exportQuality', q.id)}
            >
              <span>{q.label}</span>
              <small>{q.desc}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
