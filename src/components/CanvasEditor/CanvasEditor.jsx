import { useEffect, useRef, useState } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
} from 'react-konva';
import { Transformer } from 'react-konva';
import useImage from './useImage';
import './CanvasEditor.css';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

// ----- Individual element renderers -----

function TextNode({ el, isSelected, onSelect, onChange }) {
  const nodeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = () => {
    const node = nodeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChange({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      fontSize: Math.max(8, Math.round(el.fontSize * scaleX)),
      width: Math.max(50, node.width() * scaleX),
    });
  };

  return (
    <>
      <Text
        ref={nodeRef}
        {...el}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

function ImageNode({ el, isSelected, onSelect, onChange }) {
  const [img] = useImage(el.src);
  const nodeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = () => {
    const node = nodeRef.current;
    onChange({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(20, node.width() * node.scaleX()),
      height: Math.max(20, node.height() * node.scaleY()),
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  return (
    <>
      <KonvaImage
        ref={nodeRef}
        image={img}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

// ----- Texture overlay -----
function TextureOverlay() {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 8;
  canvasEl.height = 8;
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, 4, 4);
  ctx.fillRect(4, 4, 4, 4);

  return (
    <Rect
      x={0}
      y={0}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      fillPatternImage={canvasEl}
      fillPatternRepeat="repeat"
      listening={false}
      opacity={0.35}
    />
  );
}

// ----- Main CanvasEditor -----
export default function CanvasEditor({
  background,
  elements,
  selectedId,
  setSelectedId,
  updateElement,
  stageRef,
  showTexture,
}) {
  const deselect = (e) => {
    if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      setSelectedId(null);
    }
  };

  return (
    <div className="canvas-wrapper">
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={deselect}
        onTouchStart={deselect}
      >
        <Layer>
          {/* Background */}
          <Rect
            name="bg"
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={background}
            listening={true}
          />

          {/* Elements */}
          {elements.map((el) => {
            const isSelected = el.id === selectedId;
            const onSelect = () => setSelectedId(el.id);
            const onChange = (changes) => updateElement(el.id, changes);

            if (el.type === 'text') {
              return (
                <TextNode
                  key={el.id}
                  el={el}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              );
            }
            if (el.type === 'image') {
              return (
                <ImageNode
                  key={el.id}
                  el={el}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              );
            }
            return null;
          })}

          {/* Texture overlay */}
          {showTexture && <TextureOverlay />}
        </Layer>
      </Stage>
    </div>
  );
}
