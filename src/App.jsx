import { useState, useEffect, useCallback } from 'react';
import { resizeToCanvas, processImage } from './utils/imageFilters.js';
import FilterSidebar from './components/ImageFilters/FilterSidebar.jsx';
import EditorCanvas from './components/ImageFilters/EditorCanvas.jsx';
import './App.css';

const DEFAULT_SETTINGS = {
  enhancement: { brightness: 100, contrast: 100, saturation: 100 },
  halftone: { dotSize: 8, density: 80, contrast: 150, invert: false, garmentMode: 'light' },
  bgremoval: { tolerance: 30 },
  metallic: { variant: 'gold' },
};

function App() {
  const [uploadedImage, setUploadedImage] = useState(null); // original HTMLImageElement
  const [workingCanvas, setWorkingCanvas] = useState(null); // resized canvas for processing
  const [originalDataUrl, setOriginalDataUrl] = useState(null);
  const [processedDataUrl, setProcessedDataUrl] = useState(null);
  const [activeFilter, setActiveFilter] = useState('enhancement');
  const [viewMode, setViewMode] = useState('processed');
  const [filterSettings, setFilterSettings] = useState(DEFAULT_SETTINGS);

  // Build working canvas when image is loaded
  const handleImageLoad = useCallback((imgEl) => {
    setUploadedImage(imgEl);
    const canvas = resizeToCanvas(imgEl, 900);
    setWorkingCanvas(canvas);
    setOriginalDataUrl(canvas.toDataURL('image/png'));
    setViewMode('processed');
  }, []);

  // Reprocess whenever filter or settings change
  useEffect(() => {
    if (!workingCanvas) {
      setProcessedDataUrl(null);
      return;
    }
    const result = processImage(workingCanvas, activeFilter, filterSettings[activeFilter]);
    if (result) {
      setProcessedDataUrl(result.toDataURL('image/png'));
    }
  }, [workingCanvas, activeFilter, filterSettings]);

  const handleSettingsChange = useCallback((filter, key, value) => {
    setFilterSettings(prev => ({
      ...prev,
      [filter]: { ...prev[filter], [key]: value },
    }));
  }, []);

  const handleFilterChange = useCallback((filterId) => {
    setActiveFilter(filterId);
    setViewMode('processed');
  }, []);

  const handleExport = () => {
    const url = processedDataUrl || originalDataUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `diseño-${activeFilter}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
            </svg>
          </div>
          <span className="app-name">Apparel Image Studio</span>
          <span className="app-badge">demo</span>
        </div>

        <div className="app-header-center">
          {uploadedImage && (
            <div className="app-filter-indicator">
              <span className="app-filter-dot" />
              <span>
                {{
                  enhancement: 'Mejora de imagen',
                  halftone: 'Semitono',
                  bgremoval: 'Quitar fondo',
                  metallic: 'Efectos metálicos',
                }[activeFilter]}
              </span>
            </div>
          )}
        </div>

        <div className="app-header-right">
          <button
            className="app-export-btn"
            onClick={handleExport}
            disabled={!uploadedImage}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exportar PNG
          </button>
        </div>
      </header>

      <div className="app-body">
        <FilterSidebar
          uploadedImage={uploadedImage}
          onImageLoad={handleImageLoad}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          filterSettings={filterSettings}
          onSettingsChange={handleSettingsChange}
        />

        <EditorCanvas
          originalUrl={originalDataUrl}
          processedUrl={processedDataUrl}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilter={activeFilter}
        />
      </div>

      <footer className="app-footer">
        Hecho por{' '}
        <a href="https://zigodev.com.ar" target="_blank" rel="noopener noreferrer">
          zigodev
        </a>
      </footer>
    </div>
  );
}

export default App;
