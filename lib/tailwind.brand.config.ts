import type { Config } from 'tailwindcss';

/**
 * Henderson Standards Tailwind Configuration
 * 
 * This extends the base Tailwind config with CR AudioViz AI brand standards.
 * Import and spread this in your app's tailwind.config.ts
 */
export const brandConfig: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Color - Cyan
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Minimum 14px for body text
        'body-min': ['0.875rem', { lineHeight: '1.5' }],
      },
      spacing: {
        // 44px tap target
        'tap': '44px',
        // Header height
        'header': '60px',
        // Credits bar height
        'credits': '40px',
      },
      minHeight: {
        'tap': '44px',
      },
      minWidth: {
        'tap': '44px',
      },
      boxShadow: {
        // 3D logo shadow
        'logo': '0 4px 14px 0 rgba(8, 145, 178, 0.39)',
        'logo-dark': '0 4px 14px 0 rgba(6, 182, 212, 0.25)',
      },
      backgroundImage: {
        // 3D gradient for logos
        'logo-gradient': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
        'logo-gradient-hover': 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)',
      },
    },
  },
};

export default brandConfig;
