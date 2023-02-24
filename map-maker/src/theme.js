export const getColor = (colorPrefix, colorName) => {
  return (
    {
      '': {
        blue: '#44F',
      },
      dark: {
        blue: '#00008B',
        red: '#8B0000',
        green: '#006400',
        yellow: '#B8860B',
      },
      light: {
        blue: '#ADD8E6',
        red: '#F08080',
        green: '#90EE90',
        yellow: '#FFF60B',
      },
    }[colorPrefix][colorName] || colorPrefix + colorName
  );
};

export const getColorStyles = color => ({
  background: getColor('dark', color),
  color: getColor('light', color),
});

export function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha !== undefined) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }
}
