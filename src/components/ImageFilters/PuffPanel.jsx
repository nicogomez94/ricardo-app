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

export default function PuffPanel({ settings, onSettingsChange }) {
  const { depth, highlightOpacity } = settings;

  return (
    <div className="puff-panel">
      <div className="panel-info">
        <span className="panel-info-icon">🫧</span>
        <p>Simula relieve inflado 3D mediante sombras de profundidad y luz superior. Ideal para propuestas de impresión puff.</p>
      </div>

      <SliderRow
        label="Profundidad"
        value={depth}
        min={1}
        max={20}
        onChange={v => onSettingsChange('depth', v)}
      />
      <SliderRow
        label="Brillo superior"
        value={highlightOpacity}
        min={0}
        max={80}
        unit="%"
        onChange={v => onSettingsChange('highlightOpacity', v)}
      />
    </div>
  );
}
