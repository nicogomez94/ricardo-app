import { EFFECTS } from '../../effects/index.js';
import './TextControls.css';

const FONTS = [
  'Impact',
  'Arial Black',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Times New Roman',
];

export default function TextControls({
  text, setText,
  fontFamily, setFontFamily,
  fontSize, setFontSize,
  effectId,
  colors, updateColor,
}) {
  const effect = EFFECTS.find((e) => e.id === effectId);
  const defaultColors = effect?.defaultColors || {};

  const colorKeys = Object.keys(defaultColors);
  const colorLabels = {
    primary: 'Color principal',
    secondary: 'Color secundario',
    background: 'Fondo',
  };

  return (
    <div className="text-controls">
      {/* Text input */}
      <div className="controls-section">
        <label className="ctrl-label">Texto del diseño</label>
        <input
          className="ctrl-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí el texto..."
          maxLength={30}
        />
      </div>

      {/* Font family */}
      <div className="controls-section">
        <label className="ctrl-label">Fuente</label>
        <select
          className="ctrl-select"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div className="controls-section">
        <label className="ctrl-label">
          Tamaño: <strong>{fontSize}px</strong>
        </label>
        <input
          type="range"
          min="40"
          max="160"
          step="2"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="ctrl-range"
        />
      </div>

      {/* Effect colors */}
      {colorKeys.length > 0 && (
        <div className="controls-section">
          <label className="ctrl-label">Colores del efecto</label>
          <div className="color-row-group">
            {colorKeys.map((key) => (
              <div key={key} className="color-row">
                <span className="color-row-label">{colorLabels[key] || key}</span>
                <input
                  type="color"
                  value={colors[key] || defaultColors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="ctrl-color"
                  title={colorLabels[key] || key}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Effect description */}
      {effect && (
        <div className="effect-desc-box">
          <span className="effect-desc-emoji">{effect.emoji}</span>
          <div>
            <div className="effect-desc-name">{effect.label}</div>
            <div className="effect-desc-text">{effect.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}
