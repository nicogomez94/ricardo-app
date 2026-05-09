export const EFFECTS = {
  none: {
    label: 'Sin efecto',
    apply: () => ({}),
  },
  outline: {
    label: 'Outline',
    apply: (color = '#ffffff') => ({
      strokeWidth: 3,
      stroke: color,
    }),
  },
  shadow: {
    label: 'Sombra',
    apply: () => ({
      shadowColor: 'rgba(0,0,0,0.7)',
      shadowBlur: 12,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
    }),
  },
  texture: {
    label: 'Textura (overlay)',
    apply: () => ({
      // Handled visually in canvas with a pattern rect overlay
      _textureOverlay: true,
    }),
  },
};
