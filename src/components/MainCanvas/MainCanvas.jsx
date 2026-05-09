import { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { renderEffect } from '../../utils/renderEffect.js';
import './MainCanvas.css';

const CANVAS_W = 760;
const CANVAS_H = 280;

export default function MainCanvas({ text, fontFamily, fontSize, effectId, colors, stageRef }) {
  const [effectImage, setEffectImage] = useState(null);

  useEffect(() => {
    const off = document.createElement('canvas');
    off.width = CANVAS_W;
    off.height = CANVAS_H;

    renderEffect(off, effectId, text, { fontFamily, fontSize, ...colors });

    const img = new window.Image();
    img.onload = () => setEffectImage(img);
    img.src = off.toDataURL();
  }, [text, fontFamily, fontSize, effectId, colors]);

  return (
    <div className="main-canvas-outer">
      <Stage ref={stageRef} width={CANVAS_W} height={CANVAS_H}>
        <Layer>
          {effectImage && (
            <KonvaImage
              image={effectImage}
              x={0}
              y={0}
              width={CANVAS_W}
              height={CANVAS_H}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
