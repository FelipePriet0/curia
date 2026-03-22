// Brand asset exports. These paths come from the brand layer.
// Use these for static asset references; do not hardcode paths elsewhere.

import brand from "./brand.config"

function deriveFavicon(iconPath: string): string {
  // If an explicit favicon is not provided, attempt a reasonable default
  // by swapping the extension to .ico. If no extension exists, append .ico.
  const dot = iconPath.lastIndexOf(".")
  if (dot > -1) return iconPath.slice(0, dot) + ".ico"
  return iconPath + ".ico"
}

export const brandAssets = {
  logoLight: brand.logo.light,
  logoDark: brand.logo.dark,
  logoIcon: brand.logo.icon,
  favicon: deriveFavicon(brand.logo.icon),
} as const

export type BrandAssets = typeof brandAssets

