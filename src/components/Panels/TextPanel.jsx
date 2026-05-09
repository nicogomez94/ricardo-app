import { FONTS } from '../../data/fonts';
import './Panel.css';

export default function TextPanel({ element, onUpdate }) {
  if (!element || element.type !== 'text') {
    return (
      <div className="panel">
        <h3 className="panel-title">Texto</h3>
        <p className="panel-hint">Seleccioná un elemento de texto en el canvas.</p>
      </div>
    );
  }

  const handle = (key) => (e) => onUpdate({ [key]: e.target.value });
  const handleNum = (key) => (e) => onUpdate({ [key]: Number(e.target.value) });

  return (
    <div className="panel">
      <h3 className="panel-title">Texto</h3>

      <label className="field-label">Contenido</label>
      <textarea
        className="field-input"
        value={element.text}
        onChange={handle('text')}
        rows={3}
      />

      <label className="field-label">Fuente</label>
      <select className="field-input" value={element.fontFamily} onChange={handle('fontFamily')}>
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>

      <label className="field-label">Tamaño: {element.fontSize}px</label>
      <input
        type="range"
        min="8"
        max="120"
        value={element.fontSize}
        onChange={handleNum('fontSize')}
        className="field-range"
      />

      <label className="field-label">Color de texto</label>
      <input type="color" value={element.fill} onChange={handle('fill')} className="field-color" />

      <label className="field-label">Estilo</label>
      <select className="field-input" value={element.fontStyle} onChange={handle('fontStyle')}>
        <option value="normal">Normal</option>
        <option value="bold">Negrita</option>
        <option value="italic">Cursiva</option>
        <option value="bold italic">Negrita + Cursiva</option>
      </select>

      <div className="divider" />
      <h4 className="panel-subtitle">Sombra</h4>

      <label className="field-label">Color de sombra</label>
      <input
        type="color"
        value={rgbaToHex(element.shadowColor)}
        onChange={(e) => onUpdate({ shadowColor: e.target.value })}
        className="field-color"
      />

      <label className="field-label">Desenfoque: {element.shadowBlur}</label>
      <input
        type="range"
        min="0"
        max="40"
        value={element.shadowBlur}
        onChange={handleNum('shadowBlur')}
        className="field-range"
      />

      <label className="field-label">Offset X: {element.shadowOffsetX}</label>
      <input
        type="range"
        min="-20"
        max="20"
        value={element.shadowOffsetX}
        onChange={handleNum('shadowOffsetX')}
        className="field-range"
      />

      <label className="field-label">Offset Y: {element.shadowOffsetY}</label>
      <input
        type="range"
        min="-20"
        max="20"
        value={element.shadowOffsetY}
        onChange={handleNum('shadowOffsetY')}
        className="field-range"
      />

      <div className="divider" />
      <h4 className="panel-subtitle">Borde / Outline</h4>

      <label className="field-label">Color de borde</label>
      <input type="color" value={element.stroke} onChange={handle('stroke')} className="field-color" />

      <label className="field-label">Grosor: {element.strokeWidth}px</label>
      <input
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={element.strokeWidth}
        onChange={handleNum('strokeWidth')}
        className="field-range"
      />
    </div>
  );
}

function rgbaToHex(color) {
  if (!color || color.startsWith('#')) return color || '#000000';
  // Convert rgba/rgb to hex for color picker
  const d = document.createElement('div');
  d.style.color = color;
  document.body.appendChild(d);
  const computed = window.getComputedStyle(d).color;
  document.body.removeChild(d);
  const match = computed.match(/\d+/g);
  if (!match) return '#000000';
  const [r, g, b] = match.map(Number);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
