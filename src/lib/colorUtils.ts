import type { ThemePalette } from "@/types/firestore";

/* ✅ DEFAULT LIGHT THEME */
export const DEFAULT_LIGHT_THEME_COLORS_HSL: ThemePalette = {
  background: '40 20% 98%',
  foreground: '20 20% 8%',

  card: '0 0% 100%',
  'card-foreground': '20 20% 8%',

  popover: '0 0% 100%',
  'popover-foreground': '20 20% 8%',

  primary: '38 92% 50%',
  'primary-foreground': '0 0% 100%',

  secondary: '40 15% 92%',
  'secondary-foreground': '20 20% 8%',

  muted: '40 15% 92%',
  'muted-foreground': '20 10% 45%',

  accent: '38 92% 50%',
  'accent-foreground': '0 0% 100%',

  destructive: '0 84.2% 60.2%',
  'destructive-foreground': '0 0% 100%',

  border: '40 15% 86%',
  input: '40 15% 86%',

  ring: '38 92% 50%',
};

/* ✅ DEFAULT DARK THEME */
export const DEFAULT_DARK_THEME_COLORS_HSL: ThemePalette = {
  background: '220 10% 6%',
  foreground: '40 15% 96%',

  card: '220 10% 10%',
  'card-foreground': '40 15% 96%',

  popover: '220 10% 10%',
  'popover-foreground': '40 15% 96%',

  primary: '45 95% 55%',
  'primary-foreground': '220 10% 6%',

  secondary: '220 10% 16%',
  'secondary-foreground': '40 15% 96%',

  muted: '220 10% 16%',
  'muted-foreground': '220 10% 65.1%',

  accent: '45 95% 55%',
  'accent-foreground': '220 10% 6%',

  destructive: '0 62.8% 40.6%',
  'destructive-foreground': '40 15% 96%',

  border: '220 10% 16%',
  input: '220 10% 16%',

  ring: '45 95% 55%',
};

/* ✅ HSL → HEX */
export function hslStringToHex(hsl: string): string {
  if (!hsl || typeof hsl !== 'string') return '#000000';

  const hslParts = hsl.split(' ').map(val => parseFloat(val.replace('%', '')));
  if (hslParts.length !== 3 || hslParts.some(isNaN)) return '#000000';

  let [h, s, l] = hslParts;
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ✅ HEX → HSL */
export function hexToHslString(hex: string): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '0 0% 0%';

  let r = 0, g = 0, b = 0;

  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    return '0 0% 0%';
  }

  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);

  let h = 0, s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}