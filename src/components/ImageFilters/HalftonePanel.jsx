import './HalftonePanel.css';

const METHODS = [
  {
    id: 'halftone',
    label: 'Semitono',
    desc: 'Trama clásica de puntos',
  },
  {
    id: 'diffusion',
    label: 'Difusión',
    desc: 'Textura orgánica',
  },
];

const DOT_SHAPES = [
  {
    id: 'round',
    label: 'Punto',
    desc: 'Puntos circulares clásicos',
  },
  {
    id: 'line',
    label: 'Línea',
    desc: 'Líneas paralelas tipo grabado',
  },
];

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  unit = '',
  step = 1,
  onChange,
}) {
  return (
    <div className="ht-ctrl-row">
      <div className="ht-ctrl-header">
        <span className="ht-ctrl-label">{label}</span>
        <span className="ht-ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ht-slider"
      />
      {description && <p className="ht-help-text">{description}</p>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="ht-toggle-wrap">
      <div className="ht-toggle-row">
        <span className="ht-toggle-label">{label}</span>
        <button
          className={`ht-toggle-btn ${checked ? 'active' : ''}`}
          onClick={() => onChange(!checked)}
          type="button"
        >
          {checked ? 'ON' : 'OFF'}
        </button>
      </div>
      {description && <p className="ht-help-text">{description}</p>}
    </div>
  );
}

function OptionGrid({ label, description, options, value, onChange }) {
  return (
    <div className="ht-section">
      <span className="ht-ctrl-label">{label}</span>
      <div className="ht-option-grid">
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            className={`ht-option-btn ${value === option.id ? 'active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className="ht-option-label">{option.label}</span>
            <span className="ht-option-desc">{option.desc}</span>
          </button>
        ))}
      </div>
      {description && <p className="ht-help-text">{description}</p>}
    </div>
  );
}

export default function HalftonePanel({
  settings,
  onSettingsChange,
  onGenerate,
  isProcessing = false,
  hasResult = false,
  isResultCurrent = false,
}) {
  const {
    cropBlackBackground = true,
    cropBlackThreshold = 25,
    blackPoint = 16,
    whitePoint = 100,
    gamma = 1,
    invertForDarkGarment = false,
    halftoneMethod = 'halftone',
    screenFrequency = 35,
    screenAngle = 23.5,
    dotShape = 'round',
  } = settings;

  const isPending = hasResult && !isResultCurrent;
  const status = isResultCurrent
    ? 'Resultado actualizado con estos ajustes.'
    : isPending
      ? 'Ajustes pendientes: generá de nuevo antes de exportar o agregar al pliego.'
      : 'Ajustá los parámetros y generá el semitono.';

  return (
    <div className="ht-panel">
      <div className="panel-info">
        <span className="panel-info-icon">⬤</span>
        <p>Genera un PNG transparente de semitono para serigrafía o print-on-demand, conservando el color original y usando la luminosidad como máscara.</p>
      </div>

      <div className="ht-section-title">Recorte</div>
      <ToggleRow
        label="Recortar fondo negro"
        checked={cropBlackBackground}
        onChange={v => onSettingsChange('cropBlackBackground', v)}
        description="Elimina automáticamente bordes casi negros alrededor de la imagen, útil para imágenes con padding oscuro."
      />
      <SliderRow
        label="Umbral de recorte"
        value={cropBlackThreshold}
        min={0}
        max={255}
        onChange={v => onSettingsChange('cropBlackThreshold', v)}
        description="Los píxeles con todos los canales RGB por debajo de este valor se tratan como fondo negro. Más alto = recorte más agresivo."
      />

      <div className="ht-divider" />
      <div className="ht-section-title">Curva tonal (Niveles)</div>
      <SliderRow
        label="Punto negro"
        value={blackPoint}
        min={0}
        max={255}
        onChange={v => onSettingsChange('blackPoint', v)}
        description="Sombras más oscuras que este valor pasan a negro puro, o transparencia en la máscara final."
      />
      <SliderRow
        label="Punto blanco"
        value={whitePoint}
        min={0}
        max={255}
        onChange={v => onSettingsChange('whitePoint', v)}
        description="Luces más claras que este valor pasan a blanco puro, u opacidad total. Más bajo = imagen general más clara."
      />
      <SliderRow
        label="Gamma"
        value={gamma}
        min={0.1}
        max={3}
        step={0.1}
        onChange={v => onSettingsChange('gamma', v)}
        description="Controla los medios tonos como el deslizador central de Niveles. Menor a 1 oscurece, mayor a 1 aclara."
      />

      <div className="ht-divider" />
      <div className="ht-section-title">Modo de salida</div>
      <ToggleRow
        label="Invertir para prenda oscura"
        checked={invertForDarkGarment}
        onChange={v => onSettingsChange('invertForDarkGarment', v)}
        description="Invierte los valores tonales para imprimir correctamente tinta clara sobre una prenda oscura."
      />

      <div className="ht-divider" />
      <div className="ht-section-title">Ajustes de semitono</div>
      <OptionGrid
        label="Método"
        value={halftoneMethod}
        options={METHODS}
        onChange={v => onSettingsChange('halftoneMethod', v)}
        description="Semitono usa una trama clásica. Difusión usa Floyd-Steinberg para una textura más orgánica."
      />
      <SliderRow
        label="Frecuencia de trama"
        value={screenFrequency}
        min={5}
        max={100}
        unit=" LPI"
        onChange={v => onSettingsChange('screenFrequency', v)}
        description="Líneas por pulgada: menor = puntos más grandes y visibles, mayor = trama más fina. 25-45 suele funcionar bien en textiles."
      />
      <SliderRow
        label="Ángulo de trama"
        value={screenAngle}
        min={0}
        max={90}
        step={0.5}
        unit="°"
        onChange={v => onSettingsChange('screenAngle', v)}
        description="Rota la trama. 22.5° o 45° son comunes para reducir artefactos moiré. Solo aplica al método Semitono."
      />
      <OptionGrid
        label="Forma"
        value={dotShape}
        options={DOT_SHAPES}
        onChange={v => onSettingsChange('dotShape', v)}
        description="Punto produce puntos circulares clásicos. Línea produce una trama de líneas paralelas. Solo aplica al método Semitono."
      />

      <div className={`ht-status ${isPending ? 'pending' : ''} ${isResultCurrent ? 'ready' : ''}`}>
        {status}
      </div>

      <button
        className="ht-generate-btn"
        type="button"
        onClick={onGenerate}
        disabled={isProcessing}
      >
        {isProcessing ? 'Generando...' : 'Generar semitono'}
      </button>
    </div>
  );
}
