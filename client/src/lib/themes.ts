export type ThemeSlug = "luxury-gold" | "romantic-floral" | "minimal-modern" | "classic-elegant";

export interface ThemePreset {
  slug: ThemeSlug;
  name: string;
  description: string;
  badge?: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textMutedColor: string;
  accentColor: string;
  coverOverlayStart: string;
  coverOverlayEnd: string;
  // Typography
  fontHeading: string;
  fontBody: string;
  // UI
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
  cardBg: string;
  cardBorder: string;
  sectionAltBg: string;
  countdownCardBg: string;
  countdownTextColor: string;
  // Decorative
  ornamentColor: string;
  dividerColor: string;
  // Tailwind classes for quick use in JSX
  primaryBtn: string;
  outlineBtn: string;
  // CSS custom properties (returned as React.CSSProperties)
  cssVars: Record<string, string>;
}

const THEMES: Record<ThemeSlug, ThemePreset> = {
  "luxury-gold": {
    slug: "luxury-gold",
    name: "Luxury Gold",
    description: "Mewah, elegan, kesan premium dengan aksen emas",
    badge: "Premium",
    primaryColor: "#C9A84C",
    secondaryColor: "#F5E6C8",
    backgroundColor: "#FFFDF5",
    textColor: "#2D1B00",
    textMutedColor: "#8B6914",
    accentColor: "#E8C96B",
    coverOverlayStart: "rgba(45,27,0,0.60)",
    coverOverlayEnd: "rgba(45,27,0,0.80)",
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    buttonBg: "#C9A84C",
    buttonText: "#ffffff",
    buttonHoverBg: "#B8942E",
    cardBg: "#FFFDF5",
    cardBorder: "#E8C96B",
    sectionAltBg: "#FDF5E4",
    countdownCardBg: "rgba(201,168,76,0.15)",
    countdownTextColor: "#C9A84C",
    ornamentColor: "#C9A84C",
    dividerColor: "#E8C96B",
    primaryBtn: "bg-[#C9A84C] hover:bg-[#B8942E] text-white border-0",
    outlineBtn: "border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10",
    cssVars: {
      "--theme-primary": "#C9A84C",
      "--theme-secondary": "#F5E6C8",
      "--theme-bg": "#FFFDF5",
      "--theme-text": "#2D1B00",
      "--theme-muted": "#8B6914",
      "--theme-accent": "#E8C96B",
      "--theme-card-bg": "#FFFDF5",
      "--theme-card-border": "#E8C96B",
      "--theme-section-alt": "#FDF5E4",
      "--theme-countdown-bg": "rgba(201,168,76,0.15)",
      "--theme-countdown-text": "#C9A84C",
      "--theme-divider": "#E8C96B",
      "--theme-font-heading": "'Playfair Display', Georgia, serif",
      "--theme-font-body": "'Plus Jakarta Sans', sans-serif",
    },
  },

  "romantic-floral": {
    slug: "romantic-floral",
    name: "Romantic Floral",
    description: "Romantis, feminin, nuansa dusty pink yang hangat",
    badge: "Populer",
    primaryColor: "#C8758A",
    secondaryColor: "#F9E8EE",
    backgroundColor: "#FFFBFC",
    textColor: "#2D1418",
    textMutedColor: "#9B6070",
    accentColor: "#E8A0B0",
    coverOverlayStart: "rgba(45,20,24,0.55)",
    coverOverlayEnd: "rgba(45,20,24,0.75)",
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    buttonBg: "#C8758A",
    buttonText: "#ffffff",
    buttonHoverBg: "#B5607B",
    cardBg: "#FFFBFC",
    cardBorder: "#F0C0CC",
    sectionAltBg: "#FDF0F3",
    countdownCardBg: "rgba(200,117,138,0.12)",
    countdownTextColor: "#C8758A",
    ornamentColor: "#E8A0B0",
    dividerColor: "#F0C0CC",
    primaryBtn: "bg-[#C8758A] hover:bg-[#B5607B] text-white border-0",
    outlineBtn: "border-[#C8758A] text-[#C8758A] hover:bg-[#C8758A]/10",
    cssVars: {
      "--theme-primary": "#C8758A",
      "--theme-secondary": "#F9E8EE",
      "--theme-bg": "#FFFBFC",
      "--theme-text": "#2D1418",
      "--theme-muted": "#9B6070",
      "--theme-accent": "#E8A0B0",
      "--theme-card-bg": "#FFFBFC",
      "--theme-card-border": "#F0C0CC",
      "--theme-section-alt": "#FDF0F3",
      "--theme-countdown-bg": "rgba(200,117,138,0.12)",
      "--theme-countdown-text": "#C8758A",
      "--theme-divider": "#F0C0CC",
      "--theme-font-heading": "'Playfair Display', Georgia, serif",
      "--theme-font-body": "'Plus Jakarta Sans', sans-serif",
    },
  },

  "minimal-modern": {
    slug: "minimal-modern",
    name: "Minimal Modern",
    description: "Bersih, modern, elegan dengan banyak whitespace",
    badge: "Baru",
    primaryColor: "#3D4A5C",
    secondaryColor: "#F0F2F5",
    backgroundColor: "#FAFBFC",
    textColor: "#1A2030",
    textMutedColor: "#6B7A90",
    accentColor: "#7A90A8",
    coverOverlayStart: "rgba(26,32,48,0.60)",
    coverOverlayEnd: "rgba(26,32,48,0.80)",
    fontHeading: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    buttonBg: "#3D4A5C",
    buttonText: "#ffffff",
    buttonHoverBg: "#2D3A4A",
    cardBg: "#FFFFFF",
    cardBorder: "#E0E5EC",
    sectionAltBg: "#F4F6F9",
    countdownCardBg: "rgba(61,74,92,0.08)",
    countdownTextColor: "#3D4A5C",
    ornamentColor: "#7A90A8",
    dividerColor: "#D4D9E2",
    primaryBtn: "bg-[#3D4A5C] hover:bg-[#2D3A4A] text-white border-0",
    outlineBtn: "border-[#3D4A5C] text-[#3D4A5C] hover:bg-[#3D4A5C]/10",
    cssVars: {
      "--theme-primary": "#3D4A5C",
      "--theme-secondary": "#F0F2F5",
      "--theme-bg": "#FAFBFC",
      "--theme-text": "#1A2030",
      "--theme-muted": "#6B7A90",
      "--theme-accent": "#7A90A8",
      "--theme-card-bg": "#FFFFFF",
      "--theme-card-border": "#E0E5EC",
      "--theme-section-alt": "#F4F6F9",
      "--theme-countdown-bg": "rgba(61,74,92,0.08)",
      "--theme-countdown-text": "#3D4A5C",
      "--theme-divider": "#D4D9E2",
      "--theme-font-heading": "'Plus Jakarta Sans', sans-serif",
      "--theme-font-body": "'Plus Jakarta Sans', sans-serif",
    },
  },

  "classic-elegant": {
    slug: "classic-elegant",
    name: "Classic Elegant",
    description: "Formal, timeless, classy dengan nuansa navy & silver",
    primaryColor: "#1E3A5F",
    secondaryColor: "#EBF0F8",
    backgroundColor: "#F8F9FC",
    textColor: "#0F1F35",
    textMutedColor: "#5A7090",
    accentColor: "#8BA8CC",
    coverOverlayStart: "rgba(15,31,53,0.60)",
    coverOverlayEnd: "rgba(15,31,53,0.82)",
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    buttonBg: "#1E3A5F",
    buttonText: "#ffffff",
    buttonHoverBg: "#152C4A",
    cardBg: "#FFFFFF",
    cardBorder: "#C5D5E8",
    sectionAltBg: "#EEF2F8",
    countdownCardBg: "rgba(30,58,95,0.10)",
    countdownTextColor: "#1E3A5F",
    ornamentColor: "#8BA8CC",
    dividerColor: "#C5D5E8",
    primaryBtn: "bg-[#1E3A5F] hover:bg-[#152C4A] text-white border-0",
    outlineBtn: "border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/10",
    cssVars: {
      "--theme-primary": "#1E3A5F",
      "--theme-secondary": "#EBF0F8",
      "--theme-bg": "#F8F9FC",
      "--theme-text": "#0F1F35",
      "--theme-muted": "#5A7090",
      "--theme-accent": "#8BA8CC",
      "--theme-card-bg": "#FFFFFF",
      "--theme-card-border": "#C5D5E8",
      "--theme-section-alt": "#EEF2F8",
      "--theme-countdown-bg": "rgba(30,58,95,0.10)",
      "--theme-countdown-text": "#1E3A5F",
      "--theme-divider": "#C5D5E8",
      "--theme-font-heading": "'Playfair Display', Georgia, serif",
      "--theme-font-body": "'Plus Jakarta Sans', sans-serif",
    },
  },
};

export const ALL_THEMES = Object.values(THEMES);

export function getTheme(slug: string): ThemePreset {
  return THEMES[slug as ThemeSlug] ?? THEMES["romantic-floral"];
}

export function getThemeCssVars(slug: string): React.CSSProperties {
  const t = getTheme(slug);
  return t.cssVars as React.CSSProperties;
}
