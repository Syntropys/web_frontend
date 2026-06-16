export const tokens = {
  brand: {
    emerald: { 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857' },
    gold: { 400: '#E5C76B', 500: '#D4AF37', 600: '#B8860B' },
  },
  state: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  chart: {
    primary: '#D4AF37',
    secondary: '#10B981',
    tertiary: '#06B6D4',
    quaternary: '#94A3B8',
    cluster: { high: '#10B981', medium: '#D4AF37', low: '#EF4444' },
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    cinematic: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    cinematic: '1200ms',
  },
} as const

export type Tokens = typeof tokens
