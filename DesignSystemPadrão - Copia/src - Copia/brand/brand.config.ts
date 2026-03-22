// Brand configuration: source of truth for identity-level values.
// Components must NEVER import colors from here directly — use semantic tokens instead.

export type BrandTypography = {
  display: string
  body: string
  mono: string
}

export type BrandLogos = {
  light: string
  dark: string
  icon: string
}

export type BrandColors = {
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral100: string
  brandNeutral900: string
  brandSuccess: string
  brandWarning: string
  brandDanger: string
}

export type BrandRadius = {
  sm: string
  md: string
  lg: string
  xl: string
}

export interface BrandConfig {
  name: string
  logo: BrandLogos
  typography: BrandTypography
  colors: BrandColors
  radius: BrandRadius
}

export const brandConfig: BrandConfig = {
  name: "Acme",
  logo: {
    light: "/assets/brand/logo-light.svg",
    dark: "/assets/brand/logo-dark.svg",
    icon: "/assets/brand/logo-icon.png",
  },
  typography: {
    display: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    body: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    mono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  colors: {
    // Raw brand color references — do not use directly in components
    brandPrimary: "#3B82F6",
    brandSecondary: "#8B5CF6",
    brandAccent: "#22D3EE",
    brandNeutral100: "#FFFFFF",
    brandNeutral900: "#0A0A0A",
    brandSuccess: "#10B981",
    brandWarning: "#F59E0B",
    brandDanger: "#EF4444",
  },
  radius: {
    sm: "0.375rem", // 6px
    md: "0.5rem",   // 8px
    lg: "0.75rem",  // 12px
    xl: "1rem",     // 16px
  },
}

export default brandConfig

