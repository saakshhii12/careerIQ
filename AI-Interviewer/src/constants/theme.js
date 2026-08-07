// src/constants/theme.js

const theme = {
  colors: {
    primary: '#20365D',
    secondary: '#263E68',
    accent: '#64D2C8',

    neon: {
      teal: '#64D2C8',
      blue: '#4DA3FF',
      purple: '#8B5CF6',
    },

    background: {
      primary: '#0B1220',
      secondary: '#111A2C',
      tertiary: '#161F33',
    },

    surface: {
      primary: '#152238',
      secondary: '#1B2A45',
      elevated: '#1F2F4D',
    },

    glass: {
      light: 'rgba(255, 255, 255, 0.06)',
      medium: 'rgba(255, 255, 255, 0.10)',
      strong: 'rgba(255, 255, 255, 0.16)',
      border: 'rgba(255, 255, 255, 0.12)',
      overlay: 'rgba(11, 18, 32, 0.72)',
    },

    border: {
      subtle: 'rgba(255,255,255,0.08)',
      default: 'rgba(255,255,255,0.14)',
      strong: 'rgba(255,255,255,0.24)',
      accent: 'rgba(100,210,200,0.40)',
    },

    text: {
      primary: '#F5F7FA',
      secondary: '#C4CCDA',
      tertiary: '#8A93A6',
      inverse: '#0B1220',
      accent: '#64D2C8',
    },

    muted: {
      primary: '#6B7385',
      secondary: '#4E5566',
      background: '#1A2136',
    },

    success: {
      main: '#3ECF8E',
      light: '#6EE7B7',
      dark: '#22A06B',
      bg: 'rgba(62,207,142,0.12)',
    },

    warning: {
      main: '#F5B851',
      light: '#FBD38D',
      dark: '#C98A2C',
      bg: 'rgba(245,184,81,0.12)',
    },

    error: {
      main: '#EF5A5A',
      light: '#F58B8B',
      dark: '#C13F3F',
      bg: 'rgba(239,90,90,0.12)',
    },
  },

  spacing: {
    none: '0px',
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
    huge: '64px',
    massive: '96px',
  },

  borderRadius: {
    none: '0px',
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    xxl: '28px',
    full: '9999px',
  },

  glow: {
    accentSm: '0 0 8px rgba(100,210,200,0.35)',
    accentMd: '0 0 16px rgba(100,210,200,0.45)',
    accentLg: '0 0 32px rgba(100,210,200,0.55)',

    primarySm: '0 0 8px rgba(32,54,93,0.5)',
    primaryMd: '0 0 20px rgba(32,54,93,0.6)',

    successSm: '0 0 8px rgba(62,207,142,0.4)',
    errorSm: '0 0 8px rgba(239,90,90,0.4)',
  },

  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.24)',
    sm: '0 2px 4px rgba(0,0,0,0.28)',
    md: '0 4px 12px rgba(0,0,0,0.32)',
    lg: '0 8px 24px rgba(0,0,0,0.36)',
    xl: '0 16px 40px rgba(0,0,0,0.40)',
    inner: 'inset 0 1px 2px rgba(0,0,0,0.30)',
    glass: '0 8px 32px rgba(0,0,0,0.28)',
  },

  animation: {
    durations: {
      instant: '80ms',
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
      slower: '600ms',
      slowest: '900ms',
    },

    easing: {
      standard: 'cubic-bezier(0.4,0,0.2,1)',
      decelerate: 'cubic-bezier(0,0,0.2,1)',
      accelerate: 'cubic-bezier(0.4,0,1,1)',
      sharp: 'cubic-bezier(0.4,0,0.6,1)',
    },
  },

  grid: {
    columns: 12,
    gutter: '24px',
    containerMaxWidth: '1440px',
    containerPadding: '24px',

    sizes: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
  },

  typography: {
    fontFamily: {
      base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },

    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    heading: {
      h1: '56px',
      h2: '40px',
      h3: '32px',
      h4: '24px',
      h5: '20px',
      h6: '18px',
    },

    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
      display: '40px',
      hero: '56px',
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },

    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.02em',
    },
  },

  breakpoints: {
    xs: '0px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4,0,0.2,1)',
    normal: '250ms cubic-bezier(0.4,0,0.2,1)',
    slow: '400ms cubic-bezier(0.4,0,0.2,1)',

    colors:
      'color 150ms ease, background-color 150ms ease, border-color 150ms ease',

    transform:
      'transform 250ms cubic-bezier(0.4,0,0.2,1)',

    opacity: 'opacity 200ms ease',
  },

  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    toast: 500,
    tooltip: 600,
  },
};

export { theme };