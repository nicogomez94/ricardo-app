import { useRef } from 'react';
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
  uploadedImage, setUploadedImage, clearUploadedImage,
}) {
  const fileRef = useRef(null);
  const effect = EFFECTS.find((e) => e.id === effectId);
  const defaultColors = effect?.defaultColors || {};
  const colorKeys = Object.keys(defaultColors);
  const colorLabels = {
    primary: 'Color principal',
    secondary: 'Color secundario',
    background: 'Fondo',
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => setUploadedImage(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const imageMode = !!uploadedImage;

  return (
    <div className="text-controls">

      {/* ---- Image upload section ---- */}
      <div className="controls-section">
        <label className="ctrl-label">Diseño / Imagen</label>
        {uploadedImage ? (
          <div className="img-preview-row">
            <img
              src={uploadedImage.src}
              alt="diseno"
              className="img-preview-thumb"
            />
            <div className="img-preview-info">
              <span className="img-preview-size">
                {uploadedImage.naturalWidth} × {uploadedImage.naturalHeight}px
              </span>
              <button className="img-clear-btn" onClick={clearUploadedImage}>
                × Quitar imagen
              </button>
            </div>
          </div>
        ) : (
          <div
            className="img-drop-zone"
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <span className="img-drop-icon">🖼</span>
            <span className="img-drop-text">Subir diseño PNG / JPG</span>
            <span className="img-drop-sub">o arrastrá acá</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
        />
      </div>

      <div className="divider" />

      {/* ---- Text controls (disabled when image active) ---- */}
      <div className={imageMode ? 'ctrl-section-disabled' : ''}>
        {imageMode && (
          <p className="img-mode-note">Modo imagen activo — controles de texto desactivados</p>
        )}
        <label className="ctrl-label">Texto del diseño</label>
        <input
          className="ctrl-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí el texto..."
          maxLength={30}
        />

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
      </div>

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
