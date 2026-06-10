import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_PREVIEW_MAX_SIZE,
  cloneFilterStep,
  getCanvasSourceSize,
  getExportQualityScale,
  getFilterStackOutputSize,
  processImage,
  processImageForExport,
  renderFilterStack,
  resizeToCanvas,
} from './utils/imageFilters.js';
import FilterSidebar from './components/ImageFilters/FilterSidebar.jsx';
import EditorCanvas from './components/ImageFilters/EditorCanvas.jsx';
import PligoCanvas from './components/ImageFilters/PligoCanvas.jsx';
import { downloadCanvasAsPng } from './utils/pngDpi.js';
import './App.css';

const DEFAULT_SETTINGS = {
  enhancement: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    scale: 100,
    vectorize: false,
    vectorThreshold: 128,
    vectorColor: '#000000',
    exportQuality: 'normal',
  },
  halftone: {
    cropBlackBackground: true,
    cropBlackThreshold: 25,
    blackPoint: 16,
    whitePoint: 100,
    gamma: 1,
    invertForDarkGarment: false,
    halftoneMethod: 'halftone',
    screenFrequency: 35,
    screenAngle: 23.5,
    dotShape: 'round',
  },
  bgremoval: { tolerance: 30, softness: 12, edgeCleanup: 55, sampleMode: 'auto', removeInterior: true },
  metallic: { variant: 'gold', bandSize: 62, bandIntensity: 46, shine: 68, texture: 14, angle: 12 },
  puff: {
    depth: 18,
    highlightOpacity: 72,
    outlineWidth: 5,
    stickerBorder: 4,
    solidify: 74,
    exportQuality: 'print',
  },
  embroidery: { threadColor: '#f5c542', patchColor: '#2c5f2e', lineSpacing: 4, patchEnabled: false },
};

function cloneSettings(settings = {}) {
  return { ...settings };
}

function settingsMatch(a = {}, b = {}) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasUnsavedSettings(filter, settings) {
  if (!DEFAULT_SETTINGS[filter]) return false;
  return !settingsMatch(settings[filter], DEFAULT_SETTINGS[filter]);
}

function resultMatchesFilter(result, filter, settings) {
  if (!result?.recipe || result.recipe.filter !== filter) return false;
  if (filter !== 'halftone') return true;
  return settingsMatch(result.recipe.settings, settings.halftone);
}

const FILTER_LABELS = {
  enhancement: 'Mejora',
  halftone: 'Semitono',
  bgremoval: 'Quitar fondo',
  metallic: 'Metálico',
  puff: 'Puff',
  embroidery: 'Bordado',
  pligo: 'Pliego',
};

function getFilterExitWarning(filter) {
  const label = FILTER_LABELS[filter] || 'este filtro';
  if (filter === 'enhancement') {
    return `Los cambios de ${label} no están aplicados. Para combinarlos con otro filtro, primero usá "Aplicar mejora". Si salís ahora, se van a perder. ¿Querés continuar?`;
  }

  return `Los cambios de ${label} no se pueden mezclar con otros filtros y se van a perder al salir. ¿Querés continuar?`;
}

function processingDelayFor(filter) {
  return filter === 'embroidery' ? 55 : 0;
}

function createPligoItemId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cropPligoSource(source, sourceW, sourceH) {
  const cropX = sourceW > 2 ? 1 : 0;
  const cropY = sourceH > 2 ? 1 : 0;
  const w = Math.max(1, sourceW - cropX * 2);
  const h = Math.max(1, sourceH - cropY * 2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, cropX, cropY, w, h, 0, 0, w, h);
  return { canvas, w, h };
}

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [workingCanvas, setWorkingCanvas] = useState(null);
  const [originalDataUrl, setOriginalDataUrl] = useState(null);
  const [appliedSteps, setAppliedSteps] = useState([]);
  const [baseExportDimensions, setBaseExportDimensions] = useState(null);
  const [pligoSource, setPligoSource] = useState(null);
  const [activeFilter, setActiveFilter] = useState('enhancement');
  const [viewMode, setViewMode] = useState('processed');
  const [filterSettings, setFilterSettings] = useState(DEFAULT_SETTINGS);
  const [pligoItems, setPligoItems] = useState([]);
  const [currentProcessed, setCurrentProcessed] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep the uploaded image untouched. Build only a smaller preview canvas for UI speed.
  const handleImageLoad = useCallback((imgEl) => {
    setUploadedImage(imgEl);
    setAppliedSteps([]);
    setBaseExportDimensions(getCanvasSourceSize(imgEl));
    setPligoSource(null);
    setCurrentProcessed(null);
    setIsProcessing(false);

    const previewCanvas = resizeToCanvas(imgEl, DEFAULT_PREVIEW_MAX_SIZE);
    setWorkingCanvas(previewCanvas);
    setOriginalDataUrl(previewCanvas.toDataURL('image/png'));
    setViewMode('processed');
  }, []);

  useEffect(() => {
    if (!workingCanvas) {
      const timeoutId = window.setTimeout(() => {
        setCurrentProcessed(null);
        setIsProcessing(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (activeFilter === 'pligo') {
      const timeoutId = window.setTimeout(() => {
        setCurrentProcessed(null);
        setIsProcessing(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (activeFilter === 'halftone') {
      const timeoutId = window.setTimeout(() => {
        setIsProcessing(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    let cancelled = false;
    let frameId = 0;
    let timeoutId = 0;
    const settings = filterSettings[activeFilter];
    const recipe = {
      steps: appliedSteps.map(cloneFilterStep),
      filter: activeFilter,
      settings: cloneSettings(settings),
    };

    frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setIsProcessing(true);

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        const result = processImage(workingCanvas, activeFilter, settings);
        if (cancelled) return;

        setCurrentProcessed(result ? {
          dataUrl: result.toDataURL('image/png'),
          recipe,
        } : null);
        setIsProcessing(false);
      }, processingDelayFor(activeFilter));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [workingCanvas, activeFilter, filterSettings, appliedSteps]);

  const currentResultMatchesActiveFilter = resultMatchesFilter(currentProcessed, activeFilter, filterSettings);
  const activeRecipe = activeFilter === 'pligo'
    ? pligoSource?.recipe || null
    : currentResultMatchesActiveFilter ? currentProcessed.recipe : null;
  const processedDataUrl = activeFilter === 'pligo'
    ? pligoSource?.dataUrl || null
    : currentResultMatchesActiveFilter ? currentProcessed.dataUrl : null;
  const hasHalftoneResult = currentProcessed?.recipe?.filter === 'halftone';
  const isHalftoneResultCurrent = resultMatchesFilter(currentProcessed, 'halftone', filterSettings);
  const canExportCurrentView = activeFilter === 'halftone'
    ? Boolean(uploadedImage && activeRecipe && !isProcessing)
    : Boolean(uploadedImage);

  const handleSettingsChange = useCallback((filter, key, value) => {
    setFilterSettings(prev => ({
      ...prev,
      [filter]: { ...prev[filter], [key]: value },
    }));
  }, []);

  const handleGenerateHalftone = useCallback(() => {
    if (!workingCanvas) return;

    const settings = cloneSettings(filterSettings.halftone);
    const recipe = {
      steps: appliedSteps.map(cloneFilterStep),
      filter: 'halftone',
      settings,
    };

    setIsProcessing(true);
    window.requestAnimationFrame(() => {
      const result = processImage(workingCanvas, 'halftone', settings);
      setCurrentProcessed(result ? {
        dataUrl: result.toDataURL('image/png'),
        recipe,
      } : null);
      setViewMode('processed');
      setIsProcessing(false);
    });
  }, [appliedSteps, filterSettings.halftone, workingCanvas]);

  const handleFilterChange = useCallback((filterId) => {
    if (filterId === activeFilter) return;

    const leavingFilter = activeFilter;
    const losesChanges = hasUnsavedSettings(leavingFilter, filterSettings);
    const leavingHasCurrentResult = resultMatchesFilter(currentProcessed, leavingFilter, filterSettings);
    const movingCurrentResultToPligo =
      filterId === 'pligo' &&
      currentProcessed?.dataUrl &&
      leavingHasCurrentResult;

    if (movingCurrentResultToPligo) {
      setPligoSource(currentProcessed);
    }

    if (losesChanges && !movingCurrentResultToPligo) {
      const confirmed = window.confirm(getFilterExitWarning(leavingFilter));
      if (!confirmed) return;

      setFilterSettings(prev => ({
        ...prev,
        [leavingFilter]: cloneSettings(DEFAULT_SETTINGS[leavingFilter]),
      }));
    }

    if (filterId === 'pligo' && !movingCurrentResultToPligo) {
      setPligoSource(null);
    }

    setActiveFilter(filterId);
    setViewMode('processed');
  }, [activeFilter, currentProcessed, filterSettings]);

  // Only enhancement is composable: it can be baked into the working base.
  const handleApply = useCallback(() => {
    if (!workingCanvas || activeFilter !== 'enhancement') return;
    const currentSettings = filterSettings[activeFilter];
    const result = processImage(workingCanvas, activeFilter, currentSettings);
    if (!result) return;

    const nextStep = {
      filter: activeFilter,
      settings: cloneSettings(currentSettings),
    };
    const nextSteps = [...appliedSteps, nextStep];

    setAppliedSteps(nextSteps);
    setWorkingCanvas(result);
    const url = result.toDataURL('image/png');
    setOriginalDataUrl(url);
    setPligoSource({
      dataUrl: url,
      recipe: {
        steps: nextSteps.map(cloneFilterStep),
        filter: activeFilter,
        settings: cloneSettings(DEFAULT_SETTINGS[activeFilter]),
      },
    });

    if (uploadedImage) {
      setBaseExportDimensions(getFilterStackOutputSize(getCanvasSourceSize(uploadedImage), nextSteps));
    }

    if (DEFAULT_SETTINGS[activeFilter]) {
      setFilterSettings(prev => ({
        ...prev,
        [activeFilter]: cloneSettings(DEFAULT_SETTINGS[activeFilter]),
      }));
    }
  }, [workingCanvas, activeFilter, filterSettings, appliedSteps, uploadedImage]);

  const renderRecipeExportCanvas = useCallback((recipe) => {
    if (!uploadedImage || !recipe) return null;

    const baseCanvas = renderFilterStack(uploadedImage, recipe.steps);
    const qualityScale = recipe.settings?.exportQuality
      ? getExportQualityScale(recipe.settings.exportQuality)
      : 1;

    return processImageForExport(baseCanvas, recipe.filter, recipe.settings, qualityScale);
  }, [uploadedImage]);

  const renderCurrentExportCanvas = useCallback(() => {
    if (!uploadedImage) return null;

    if (activeFilter === 'pligo') {
      return activeRecipe
        ? renderRecipeExportCanvas(activeRecipe)
        : renderFilterStack(uploadedImage, appliedSteps);
    }

    return activeRecipe ? renderRecipeExportCanvas(activeRecipe) : null;
  }, [activeFilter, activeRecipe, appliedSteps, renderRecipeExportCanvas, uploadedImage]);

  const handleAddToPligo = useCallback(() => {
    if (!processedDataUrl || !activeRecipe) return;
    const exportCanvas = renderRecipeExportCanvas(activeRecipe);
    if (exportCanvas) {
      const { canvas, w, h } = cropPligoSource(exportCanvas, exportCanvas.width, exportCanvas.height);
      setPligoItems(prev => [...prev, { id: createPligoItemId(), dataUrl: canvas.toDataURL('image/png'), w, h }]);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const sourceW = img.naturalWidth || img.width;
      const sourceH = img.naturalHeight || img.height;
      const { canvas, w, h } = cropPligoSource(img, sourceW, sourceH);
      setPligoItems(prev => [...prev, { id: createPligoItemId(), dataUrl: canvas.toDataURL('image/png'), w, h }]);
    };
    img.src = processedDataUrl;
  }, [activeRecipe, processedDataUrl, renderRecipeExportCanvas]);

  const handleDuplicatePligoItem = useCallback((id) => {
    setPligoItems(prev => {
      const item = prev.find(it => it.id === id);
      if (!item) return prev;
      return [...prev, { ...item, id: createPligoItemId() }];
    });
  }, []);

  const handleRemovePligoItem = useCallback((id) => {
    setPligoItems(prev => prev.filter(it => it.id !== id));
  }, []);

  const handleClearPligo = useCallback(() => {
    setPligoItems([]);
  }, []);

  const handleExport = async () => {
    const exportCanvas = renderCurrentExportCanvas();
    const filename = `diseño-${activeFilter}-${Date.now()}.png`;

    if (exportCanvas) {
      await downloadCanvasAsPng(exportCanvas, filename, {
        dpi: activeRecipe?.filter === 'halftone' ? 300 : undefined,
      });
      return;
    }

    if (activeFilter === 'halftone') return;

    const url = processedDataUrl || originalDataUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
          <span className="app-badge">pro</span>
        </div>

        <div className="app-header-center">
          {(uploadedImage || activeFilter === 'pligo') && (
            <div className="app-filter-indicator">
              <span className="app-filter-dot" />
              <span>
                {{
                  enhancement: 'Mejora de imagen',
                  halftone: 'Semitono',
                  bgremoval: 'Quitar fondo',
                  metallic: 'Efectos metálicos',
                  puff: 'Efecto puff',
                  embroidery: 'Bordado',
                  pligo: 'Arma tu pliego · DTF',
                }[activeFilter]}
              </span>
            </div>
          )}
        </div>

        <div className="app-header-right">
          {activeFilter !== 'pligo' && (
            <button
              className="app-export-btn"
              onClick={handleExport}
              disabled={!canExportCurrentView}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exportar PNG
            </button>
          )}
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
          onApply={handleApply}
          onGenerateHalftone={handleGenerateHalftone}
          halftoneStatus={{
            isProcessing: activeFilter === 'halftone' && isProcessing,
            hasResult: hasHalftoneResult,
            isResultCurrent: isHalftoneResultCurrent,
          }}
          workingDimensions={baseExportDimensions || (workingCanvas ? { w: workingCanvas.width, h: workingCanvas.height } : null)}
          pligoItems={pligoItems}
          processedDataUrl={processedDataUrl}
          onAddToPligo={handleAddToPligo}
          onDuplicatePligoItem={handleDuplicatePligoItem}
          onRemovePligoItem={handleRemovePligoItem}
          onClearPligo={handleClearPligo}
        />

        {activeFilter === 'pligo' ? (
          <PligoCanvas items={pligoItems} />
        ) : (
          <EditorCanvas
            originalUrl={originalDataUrl}
            processedUrl={processedDataUrl}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilter={activeFilter}
            isProcessing={isProcessing}
            showTransparentGrid={activeFilter === 'embroidery' && !filterSettings.embroidery.patchEnabled}
            imageMeta={{
              preview: workingCanvas ? { w: workingCanvas.width, h: workingCanvas.height } : null,
              export: baseExportDimensions,
            }}
          />
        )}
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
