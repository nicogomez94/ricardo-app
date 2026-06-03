import './EmbroideryPanel.css';

function SliderRow({ label, value, min, max, unit = '', step = 1, onChange }) {
  return (
    <div className="emb-ctrl-row">
      <div className="emb-ctrl-header">
        <span className="emb-ctrl-label">{label}</span>
        <span className="emb-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="emb-slider"
      />
    </div>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="emb-color-row">
      <span className="emb-ctrl-label">{label}</span>
      <div className="emb-color-wrap">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="emb-color-input"
        />
        <span className="emb-color-hex">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="emb-toggle-row">
      <span className="emb-ctrl-label">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="emb-toggle-input"
      />
      <span className="emb-toggle-track" aria-hidden="true">
        <span className="emb-toggle-thumb" />
      </span>
    </label>
  );
}

export default function EmbroideryPanel({ settings, onSettingsChange }) {
  const { threadColor, patchColor, lineSpacing, patchEnabled = false } = settings;

  return (
    <div className="emb-panel">
      <div className="panel-info">
        <span className="panel-info-icon">🧵</span>
        <p>Simula textura de bordado con trama de hilos sobre parche. Ideal para propuestas comerciales de textil.</p>
      </div>

      <ColorRow
        label="Color de hilo"
        value={threadColor}
        onChange={v => onSettingsChange('threadColor', v)}
      />
      <ToggleRow
        label="Fondo de parche"
        checked={patchEnabled}
        onChange={v => onSettingsChange('patchEnabled', v)}
      />
      {patchEnabled && (
        <ColorRow
          label="Color de parche"
          value={patchColor}
          onChange={v => onSettingsChange('patchColor', v)}
        />
      )}
      <SliderRow
        label="Espaciado de hilo"
        value={lineSpacing}
        min={2}
        max={12}
        unit="px"
        onChange={v => onSettingsChange('lineSpacing', v)}
      />
    </div>
  );
}
