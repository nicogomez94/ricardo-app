import { useEditorState } from './hooks/useEditorState.js';
import { exportStageToPNG } from './utils/exportCanvas.js';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import EffectGallery from './components/EffectGallery/EffectGallery.jsx';
import MainCanvas from './components/MainCanvas/MainCanvas.jsx';
import TextControls from './components/TextControls/TextControls.jsx';
import './App.css';

function App() {
  const {
    text, setText,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    effectId, selectEffect,
    colors, updateColor,
    uploadedImage, setUploadedImage, clearUploadedImage,
    stageRef,
  } = useEditorState();

  const handleExport = () => {
    exportStageToPNG(stageRef.current, `${effectId}-${text || 'diseno'}.png`);
  };

  return (
    <div className="app">
      <Toolbar onExport={handleExport} />

      <div className="app-body">
        <EffectGallery
          selectedEffectId={effectId}
          onSelect={selectEffect}
          userText={text}
          fontFamily={fontFamily}
          uploadedImage={uploadedImage}
        />

        <main className="editor-main">
          <div className="canvas-area">
            <MainCanvas
              text={text}
              fontFamily={fontFamily}
              fontSize={fontSize}
              effectId={effectId}
              colors={colors}
              uploadedImage={uploadedImage}
              stageRef={stageRef}
            />
          </div>

          <TextControls
            text={text}
            setText={setText}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            effectId={effectId}
            colors={colors}
            updateColor={updateColor}
            uploadedImage={uploadedImage}
            setUploadedImage={setUploadedImage}
            clearUploadedImage={clearUploadedImage}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
