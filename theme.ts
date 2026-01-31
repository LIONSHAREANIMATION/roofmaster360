import { Platform } from "react-native";

// Carbon Fiber Matte Black Color Palette
const carbonBlack = "#0A0A0A";
const carbonDark = "#121212";
const carbonMid = "#1A1A1A";
const carbonLight = "#242424";

// Translucent highlights (no chrome/metallic)
const translucentWhite = "rgba(255, 255, 255, 0.9)";
const translucentLight = "rgba(255, 255, 255, 0.7)";
const translucentMid = "rgba(255, 255, 255, 0.5)";
const translucentMuted = "rgba(255, 255, 255, 0.35)";

// Accent colors
const successGlow = "#22C55E";
const errorGlow = "#EF4444";

// Carbon fiber gradient backgrounds
export const GraphiteGradient = {
  colors: [carbonBlack, carbonDark, carbonBlack] as const,
  meshColors: [carbonBlack, carbonDark, carbonMid, carbonDark, carbonBlack] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// Glass effect colors - translucent, not metallic
const glassOverlay = "rgba(255, 255, 255, 0.04)";
const glassBorder = "rgba(255, 255, 255, 0.08)";
const glassOverlayDark = "rgba(255, 255, 255, 0.03)";
const translucentTint = "rgba(255, 255, 255, 0.06)";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
    textMuted: "rgba(255, 255, 255, 0.5)",
    buttonText: carbonBlack,
    tabIconDefault: "rgba(255, 255, 255, 0.35)",
    tabIconSelected: translucentWhite,
    link: translucentWhite,
    primary: translucentWhite,
    accent: translucentWhite,
    success: successGlow,
    error: errorGlow,
    backgroundRoot: carbonBlack,
    backgroundDefault: "rgba(255, 255, 255, 0.04)",
    backgroundSecondary: "rgba(255, 255, 255, 0.06)",
    backgroundTertiary: "rgba(255, 255, 255, 0.08)",
    divider: "rgba(255, 255, 255, 0.06)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputFocus: translucentLight,
    // Translucent glass colors
    glassPlatinum: translucentWhite,
    glassSilver: translucentMid,
    glassPlatinumTint: translucentTint,
    glassSilverTint: "rgba(255, 255, 255, 0.04)",
    glassBackground: glassOverlay,
    glassBorder: glassBorder,
    glassPlatinumGlow: "rgba(255, 255, 255, 0.15)",
    glassSilverGlow: "rgba(255, 255, 255, 0.1)",
    chromeHighlight: "rgba(255, 255, 255, 0.08)",
    chromeShadow: "rgba(0, 0, 0, 0.6)",
    // Graphite metallic accent
    glassBlue: translucentWhite,
    glassOrange: "#8A9099",
    glassBlueTint: translucentTint,
    glassOrangeTint: "rgba(138, 144, 153, 0.2)",
    glassBlueGlow: "rgba(255, 255, 255, 0.15)",
    glassOrangeGlow: "rgba(138, 144, 153, 0.4)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
    textMuted: "rgba(255, 255, 255, 0.5)",
    buttonText: carbonBlack,
    tabIconDefault: "rgba(255, 255, 255, 0.35)",
    tabIconSelected: translucentWhite,
    link: translucentWhite,
    primary: translucentWhite,
    accent: translucentWhite,
    success: successGlow,
    error: errorGlow,
    backgroundRoot: carbonBlack,
    backgroundDefault: "rgba(255, 255, 255, 0.04)",
    backgroundSecondary: "rgba(255, 255, 255, 0.06)",
    backgroundTertiary: "rgba(255, 255, 255, 0.08)",
    divider: "rgba(255, 255, 255, 0.06)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputFocus: translucentLight,
    // Translucent glass colors
    glassPlatinum: translucentWhite,
    glassSilver: translucentMid,
    glassPlatinumTint: translucentTint,
    glassSilverTint: "rgba(255, 255, 255, 0.04)",
    glassBackground: glassOverlayDark,
    glassBorder: glassBorder,
    glassPlatinumGlow: "rgba(255, 255, 255, 0.15)",
    glassSilverGlow: "rgba(255, 255, 255, 0.1)",
    chromeHighlight: "rgba(255, 255, 255, 0.06)",
    chromeShadow: "rgba(0, 0, 0, 0.7)",
    // Graphite metallic accent
    glassBlue: translucentWhite,
    glassOrange: "#8A9099",
    glassBlueTint: translucentTint,
    glassOrangeTint: "rgba(138, 144, 153, 0.2)",
    glassBlueGlow: "rgba(255, 255, 255, 0.15)",
    glassOrangeGlow: "rgba(138, 144, 153, 0.4)",
  },
};

// Glass effect styles for reuse
export const GlassStyles = {
  panel: {
    backgroundColor: glassOverlay,
    borderWidth: 1,
    borderColor: glassBorder,
    overflow: "hidden" as const,
  },
  blurIntensity: 24,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 50,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  // Subtle translucent glow (not metallic)
  platinum: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
