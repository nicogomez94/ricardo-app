import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

export default function TransformableElement({ isSelected, onSelect, children }) {
  const transformerRef = useRef(null);
  const nodeRef = useRef(null);

  // Children must forward a ref via React.cloneElement
  // We attach the transformer manually
  useEffect(() => {
    if (isSelected && transformerRef.current && nodeRef.current) {
      transformerRef.current.nodes([nodeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // eslint-disable-next-line react-hooks/refs
  const child = children(nodeRef, onSelect);

  return (
    <>
      {child}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size guard
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
          ]}
        />
      )}
    </>
  );
}
