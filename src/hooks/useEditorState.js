import { useState, useRef } from 'react';
import { EFFECTS } from '../effects/index.js';

export function useEditorState() {
  const [text, setText] = useState('VARSITY');
  const [fontFamily, setFontFamily] = useState('Impact');
  const [fontSize, setFontSize] = useState(110);
  const [effectId, setEffectId] = useState('rhinestone');
  const [colors, setColors] = useState(EFFECTS[0].defaultColors);
  // uploadedImage: HTMLImageElement | null
  const [uploadedImage, setUploadedImage] = useState(null);
  const stageRef = useRef(null);

  const selectEffect = (id) => {
    setEffectId(id);
    const effect = EFFECTS.find((e) => e.id === id);
    if (effect?.defaultColors) {
      setColors({ ...effect.defaultColors });
    }
  };

  const updateColor = (key, value) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const clearUploadedImage = () => setUploadedImage(null);

  return {
    text,
    setText,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    effectId,
    selectEffect,
    colors,
    updateColor,
    uploadedImage,
    setUploadedImage,
    clearUploadedImage,
    stageRef,
  };
}
