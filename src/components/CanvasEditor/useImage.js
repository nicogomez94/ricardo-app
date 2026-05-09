import { useState, useEffect } from 'react';

export default function useImage(src) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);
  return [image];
}
