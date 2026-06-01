import { useRef } from 'react';
import ImageEnhancementPanel from './ImageEnhancementPanel';
import HalftonePanel from './HalftonePanel';
import BackgroundRemovalPanel from './BackgroundRemovalPanel';
import MetallicEffectsPanel from './MetallicEffectsPanel';
import PuffPanel from './PuffPanel';
import EmbroideryPanel from './EmbroideryPanel';
import PligoPanel from './PligoPanel';
import './FilterSidebar.css';

const FILTERS = [
  {
    id: 'enhancement',
    label: 'Mejora',
    icon: '◈',
    description: 'Brillo · Contraste · Saturación',
  },
  {
    id: 'halftone',
    label: 'Semitono',
    icon: '⬤',
    description: 'Trama de puntos',
  },
  {
    id: 'bgremoval',
    label: 'Quitar fondo',
    icon: '✂',
    description: 'Elimina fondo blanco',
  },
  {
    id: 'metallic',
    label: 'Metálico',
    icon: '✦',
    description: 'Dorado · Plateado · Cobre · Cromo',
  },
  {
    id: 'puff',
    label: 'Puff',
    icon: '🫧',
    description: 'Relieve inflado 3D',
  },
  {
    id: 'embroidery',
    label: 'Bordado',
    icon: '🧵',
    description: 'Textura de hilos sobre parche',
  },
  {
    id: 'pligo',
    label: 'Arma tu pliego',
    icon: '🧷',
    description: 'DTF · 58 cm × 1 metro',
  },
];

export default function FilterSidebar({
  uploadedImage,
  onImageLoad,
  activeFilter,
  onFilterChange,
  filterSettings,
  onSettingsChange,
  onApply,
  workingDimensions,
  pligoItems,
  processedDataUrl,
  onAddToPligo,
  onRemovePligoItem,
  onClearPligo,
}) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => onImageLoad(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const renderPanel = () => {
    const settings = filterSettings[activeFilter];
    const onChange = (key, value) => onSettingsChange(activeFilter, key, value);
    switch (activeFilter) {
      case 'enhancement': return <ImageEnhancementPanel settings={settings} onSettingsChange={onChange} onApply={onApply} workingDimensions={workingDimensions} />;
      case 'halftone':    return <HalftonePanel settings={settings} onSettingsChange={onChange} />;
      case 'bgremoval':   return <BackgroundRemovalPanel settings={settings} onSettingsChange={onChange} />;
      case 'metallic':    return <MetallicEffectsPanel settings={settings} onSettingsChange={onChange} />;
      case 'puff':        return <PuffPanel settings={settings} onSettingsChange={onChange} />;
      case 'embroidery':  return <EmbroideryPanel settings={settings} onSettingsChange={onChange} />;
      case 'pligo':       return <PligoPanel items={pligoItems} processedDataUrl={processedDataUrl} onAdd={onAddToPligo} onRemove={onRemovePligoItem} onClear={onClearPligo} />;
      default:            return null;
    }
  };

  return (
    <aside className="filter-sidebar">
      {/* Left: filter nav column */}
      <div className="filter-nav-col">
        <div className="sidebar-upload-section">
          {uploadedImage ? (
            <div className="upload-preview">
              <img src={uploadedImage.src} alt="preview" className="upload-thumb" />
              <div className="upload-preview-info">
                <span className="upload-dim">{uploadedImage.naturalWidth} × {uploadedImage.naturalHeight}px</span>
                <button className="upload-change-btn" onClick={() => fileRef.current?.click()}>
                  Cambiar imagen
                </button>
              </div>
            </div>
          ) : (
            <div
              className="upload-dropzone"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="upload-icon">↑</div>
              <span className="upload-text">Subir imagen</span>
              <span className="upload-sub">PNG, JPG, WEBP · o arrastrá aquí</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        <div className="sidebar-filter-nav">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-nav-btn ${activeFilter === f.id ? 'active' : ''} ${!uploadedImage && f.id !== 'pligo' ? 'disabled' : ''}`}
              onClick={() => (uploadedImage || f.id === 'pligo') && onFilterChange(f.id)}
            >
              <span className="filter-nav-icon">{f.icon}</span>
              <div className="filter-nav-text">
                <span className="filter-nav-label">{f.label}</span>
                <span className="filter-nav-desc">{f.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: active panel column */}
      <div className="filter-panel-col">
        {(uploadedImage || activeFilter === 'pligo') ? (
          <div className="sidebar-panel-container">
            <div className="panel-info-bar">
              <span>{FILTERS.find(f => f.id === activeFilter)?.icon}</span>
              <span className="panel-info-bar-title">{FILTERS.find(f => f.id === activeFilter)?.label}</span>
            </div>
            {renderPanel()}
          </div>
        ) : (
          <div className="sidebar-empty-hint">
            <div className="sidebar-empty-icon">🖼</div>
            <p>Subí una imagen para empezar a usar los filtros.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
