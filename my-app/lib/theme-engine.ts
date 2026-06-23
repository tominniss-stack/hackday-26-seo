/**
 * Theme Engine: Generates complementary color palette from primary hex
 * Supports manual overrides via theme_overrides JSONB
 */

export interface ThemeOverrides {
  secondary?: string;
  accent?: string;
}

export interface ThemePalette {
  primary: string;
  primaryHSL: string;
  secondary: string;
  secondaryHSL: string;
  accent: string;
  accentHSL: string;
}

/**
 * Convert hex color to HSL
 * @param hex - Hex color string (with or without #)
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB (0-1 range)
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generate complementary secondary color (180° hue shift)
 * @param primaryHSL - Primary color in HSL
 * @returns HSL string for CSS variables
 */
function generateSecondary(primaryHSL: { h: number; s: number; l: number }): string {
  const h = (primaryHSL.h + 180) % 360;
  return `${h} ${primaryHSL.s}% ${primaryHSL.l}%`;
}

/**
 * Generate accent color (triadic: 120° hue shift, slightly lighter)
 * @param primaryHSL - Primary color in HSL
 * @returns HSL string for CSS variables
 */
function generateAccent(primaryHSL: { h: number; s: number; l: number }): string {
  const h = (primaryHSL.h + 120) % 360;
  const l = Math.min(primaryHSL.l + 10, 90); // Slightly lighter
  return `${h} ${primaryHSL.s}% ${l}%`;
}

/**
 * Main theme engine: generates full palette with override support
 * @param primaryHex - Primary brand color in hex format
 * @param overrides - Optional manual color overrides
 * @returns Complete theme palette with HSL values
 */
export function generateThemePalette(
  primaryHex: string,
  overrides?: ThemeOverrides | null
): ThemePalette {
  // Ensure primary hex is valid, fallback to blue
  if (!primaryHex || !primaryHex.match(/^#?[0-9A-Fa-f]{6}$/)) {
    primaryHex = '#3b82f6';
  }

  const primaryHSL = hexToHSL(primaryHex);
  const primaryHSLString = `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`;

  // Check for manual overrides
  const secondaryHSL = overrides?.secondary
    ? hexToHSL(overrides.secondary)
    : null;
  const accentHSL = overrides?.accent
    ? hexToHSL(overrides.accent)
    : null;

  return {
    primary: primaryHex,
    primaryHSL: primaryHSLString,
    secondary: overrides?.secondary || primaryHex,
    secondaryHSL: secondaryHSL
      ? `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`
      : generateSecondary(primaryHSL),
    accent: overrides?.accent || primaryHex,
    accentHSL: accentHSL
      ? `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`
      : generateAccent(primaryHSL),
  };
}

/**
 * Generate inline CSS style object for theme variables
 * @param palette - Theme palette
 * @returns CSS style object for React inline styles
 */
export function getThemeStyles(palette: ThemePalette): React.CSSProperties {
  return {
    '--theme-primary': palette.primary,
    '--theme-primary-hsl': palette.primaryHSL,
    '--theme-secondary': palette.secondary,
    '--theme-secondary-hsl': palette.secondaryHSL,
    '--theme-accent': palette.accent,
    '--theme-accent-hsl': palette.accentHSL,
  } as React.CSSProperties;
}

/**
 * Inject CSS variables as a style string (for SSR or string injection)
 * @param palette - Theme palette
 * @returns CSS variable declarations as string
 */
export function injectThemeVariables(palette: ThemePalette): string {
  return `
    --theme-primary: ${palette.primary};
    --theme-primary-hsl: ${palette.primaryHSL};
    --theme-secondary: ${palette.secondary};
    --theme-secondary-hsl: ${palette.secondaryHSL};
    --theme-accent: ${palette.accent};
    --theme-accent-hsl: ${palette.accentHSL};
  `.trim();
}
