export interface Theme {
  name: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
    success: string
    warning: string
    error: string
    info: string
  }
}

export const themes: Record<string, Theme> = {
  light: {
    name: "Light",
    colors: {
      background: "oklch(0.99 0 0)",
      foreground: "oklch(0.15 0 0)",
      card: "oklch(0.97 0 0)",
      cardForeground: "oklch(0.15 0 0)",
      popover: "oklch(0.98 0 0)",
      popoverForeground: "oklch(0.15 0 0)",
      primary: "oklch(0.5 0.18 240)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.92 0 0)",
      secondaryForeground: "oklch(0.15 0 0)",
      muted: "oklch(0.94 0 0)",
      mutedForeground: "oklch(0.45 0 0)",
      accent: "oklch(0.93 0 0)",
      accentForeground: "oklch(0.15 0 0)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.99 0 0)",
      border: "oklch(0.88 0 0)",
      input: "oklch(0.88 0 0)",
      ring: "oklch(0.5 0.18 240)",
      success: "oklch(0.5 0.18 145)",
      warning: "oklch(0.6 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.5 0.15 230)",
    },
  },
  cyan: {
    name: "Cyan",
    colors: {
      background: "oklch(0.12 0.01 240)",
      foreground: "oklch(0.98 0.005 240)",
      card: "oklch(0.16 0.012 240)",
      cardForeground: "oklch(0.98 0.005 240)",
      popover: "oklch(0.14 0.01 240)",
      popoverForeground: "oklch(0.98 0.005 240)",
      primary: "oklch(0.7 0.15 195)",
      primaryForeground: "oklch(0.12 0.01 240)",
      secondary: "oklch(0.22 0.015 240)",
      secondaryForeground: "oklch(0.98 0.005 240)",
      muted: "oklch(0.2 0.012 240)",
      mutedForeground: "oklch(0.65 0.01 240)",
      accent: "oklch(0.24 0.015 240)",
      accentForeground: "oklch(0.98 0.005 240)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 240)",
      border: "oklch(0.25 0.015 240)",
      input: "oklch(0.22 0.015 240)",
      ring: "oklch(0.7 0.15 195)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  purple: {
    name: "Purple",
    colors: {
      background: "oklch(0.12 0.01 280)",
      foreground: "oklch(0.98 0.005 280)",
      card: "oklch(0.16 0.012 280)",
      cardForeground: "oklch(0.98 0.005 280)",
      popover: "oklch(0.14 0.01 280)",
      popoverForeground: "oklch(0.98 0.005 280)",
      primary: "oklch(0.65 0.22 290)",
      primaryForeground: "oklch(0.98 0.005 280)",
      secondary: "oklch(0.22 0.015 280)",
      secondaryForeground: "oklch(0.98 0.005 280)",
      muted: "oklch(0.2 0.012 280)",
      mutedForeground: "oklch(0.65 0.01 280)",
      accent: "oklch(0.24 0.015 280)",
      accentForeground: "oklch(0.98 0.005 280)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 280)",
      border: "oklch(0.25 0.015 280)",
      input: "oklch(0.22 0.015 280)",
      ring: "oklch(0.65 0.22 290)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  green: {
    name: "Green",
    colors: {
      background: "oklch(0.12 0.01 160)",
      foreground: "oklch(0.98 0.005 160)",
      card: "oklch(0.16 0.012 160)",
      cardForeground: "oklch(0.98 0.005 160)",
      popover: "oklch(0.14 0.01 160)",
      popoverForeground: "oklch(0.98 0.005 160)",
      primary: "oklch(0.65 0.18 145)",
      primaryForeground: "oklch(0.12 0.01 160)",
      secondary: "oklch(0.22 0.015 160)",
      secondaryForeground: "oklch(0.98 0.005 160)",
      muted: "oklch(0.2 0.012 160)",
      mutedForeground: "oklch(0.65 0.01 160)",
      accent: "oklch(0.24 0.015 160)",
      accentForeground: "oklch(0.98 0.005 160)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 160)",
      border: "oklch(0.25 0.015 160)",
      input: "oklch(0.22 0.015 160)",
      ring: "oklch(0.65 0.18 145)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  orange: {
    name: "Orange",
    colors: {
      background: "oklch(0.12 0.01 40)",
      foreground: "oklch(0.98 0.005 40)",
      card: "oklch(0.16 0.012 40)",
      cardForeground: "oklch(0.98 0.005 40)",
      popover: "oklch(0.14 0.01 40)",
      popoverForeground: "oklch(0.98 0.005 40)",
      primary: "oklch(0.7 0.18 50)",
      primaryForeground: "oklch(0.12 0.01 40)",
      secondary: "oklch(0.22 0.015 40)",
      secondaryForeground: "oklch(0.98 0.005 40)",
      muted: "oklch(0.2 0.012 40)",
      mutedForeground: "oklch(0.65 0.01 40)",
      accent: "oklch(0.24 0.015 40)",
      accentForeground: "oklch(0.98 0.005 40)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 40)",
      border: "oklch(0.25 0.015 40)",
      input: "oklch(0.22 0.015 40)",
      ring: "oklch(0.7 0.18 50)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  blue: {
    name: "Blue",
    colors: {
      background: "oklch(0.12 0.01 240)",
      foreground: "oklch(0.98 0.005 240)",
      card: "oklch(0.16 0.012 240)",
      cardForeground: "oklch(0.98 0.005 240)",
      popover: "oklch(0.14 0.01 240)",
      popoverForeground: "oklch(0.98 0.005 240)",
      primary: "oklch(0.6 0.2 250)",
      primaryForeground: "oklch(0.98 0.005 240)",
      secondary: "oklch(0.22 0.015 240)",
      secondaryForeground: "oklch(0.98 0.005 240)",
      muted: "oklch(0.2 0.012 240)",
      mutedForeground: "oklch(0.65 0.01 240)",
      accent: "oklch(0.24 0.015 240)",
      accentForeground: "oklch(0.98 0.005 240)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 240)",
      border: "oklch(0.25 0.015 240)",
      input: "oklch(0.22 0.015 240)",
      ring: "oklch(0.6 0.2 250)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  darkBlue: {
    name: "Dark Blue",
    colors: {
      background: "oklch(0.1 0.02 235)",
      foreground: "oklch(0.98 0.005 235)",
      card: "oklch(0.14 0.025 235)",
      cardForeground: "oklch(0.98 0.005 235)",
      popover: "oklch(0.12 0.02 235)",
      popoverForeground: "oklch(0.98 0.005 235)",
      primary: "oklch(0.55 0.25 240)",
      primaryForeground: "oklch(0.98 0.005 235)",
      secondary: "oklch(0.2 0.02 235)",
      secondaryForeground: "oklch(0.98 0.005 235)",
      muted: "oklch(0.18 0.02 235)",
      mutedForeground: "oklch(0.6 0.015 235)",
      accent: "oklch(0.22 0.025 235)",
      accentForeground: "oklch(0.98 0.005 235)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 235)",
      border: "oklch(0.23 0.025 235)",
      input: "oklch(0.2 0.02 235)",
      ring: "oklch(0.55 0.25 240)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
  red: {
    name: "Red",
    colors: {
      background: "oklch(0.12 0.01 20)",
      foreground: "oklch(0.98 0.005 20)",
      card: "oklch(0.16 0.012 20)",
      cardForeground: "oklch(0.98 0.005 20)",
      popover: "oklch(0.14 0.01 20)",
      popoverForeground: "oklch(0.98 0.005 20)",
      primary: "oklch(0.6 0.24 25)",
      primaryForeground: "oklch(0.98 0.005 20)",
      secondary: "oklch(0.22 0.015 20)",
      secondaryForeground: "oklch(0.98 0.005 20)",
      muted: "oklch(0.2 0.012 20)",
      mutedForeground: "oklch(0.65 0.01 20)",
      accent: "oklch(0.24 0.015 20)",
      accentForeground: "oklch(0.98 0.005 20)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.005 20)",
      border: "oklch(0.25 0.015 20)",
      input: "oklch(0.22 0.015 20)",
      ring: "oklch(0.6 0.24 25)",
      success: "oklch(0.65 0.18 145)",
      warning: "oklch(0.75 0.15 85)",
      error: "oklch(0.55 0.22 25)",
      info: "oklch(0.65 0.15 230)",
    },
  },
}

export function applyTheme(themeId: string) {
  const theme = themes[themeId]
  if (!theme) return

  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })
}

export function getStoredTheme(): string {
  if (typeof window === "undefined") return "cyan"
  return localStorage.getItem("realmmesh-theme") || "cyan"
}

export function setStoredTheme(themeId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("realmmesh-theme", themeId)
}
