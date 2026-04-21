import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NCRemedies Botanical Atelier — museum-quality palette
        primary: {
          50:  '#f0f7ed',
          100: '#dbecd3',
          200: '#b8d8a9',
          300: '#8ec082',
          400: '#6daa60',  // sage hover
          500: '#508e44',  // botanical sage (muted, natural)
          600: '#3c7031',
          700: '#2d5224',
          800: '#1e3819',
          900: '#122110',
          950: '#08130A',
        },
        secondary: {
          50:  '#fdf8ec',
          100: '#f8eece',
          200: '#f0d98e',
          300: '#e4be55',
          400: '#C9A84C',  // antique gold — main accent
          500: '#A8881F',
          600: '#866C0E',
          700: '#6B5309',
          800: '#4C3A06',
          900: '#302403',
          950: '#1A1301',
        },
        // Botanical ink — warm dark palette with green cast
        earth: {
          50:  '#F8F3E8',  // warm cream (light mode bg)
          100: '#EDE5CF',  // parchment
          200: '#D8CCAF',  // aged paper
          300: '#B8AD96',  // muted warm text
          400: '#9A9080',  // secondary muted text
          500: '#6E6758',  // tertiary text
          600: '#4A443A',  // dark muted
          700: '#2C2820',  // very dark warm
          800: '#1C1A14',  // surface elevated
          900: '#111009',  // main dark bg (green-cast)
          950: '#09090A',  // deepest
        },
        // Status colors
        success: '#5EA55E',
        warning: '#C9A84C',
        error:   '#B85C5C',
        info:    '#5C85B8',
        // Cream text colors for convenient use
        cream: {
          50:  '#FDFAF4',
          100: '#F8F3E8',
          200: '#EDE5CF',
          300: '#D8CCAF',
          400: '#B8AD96',
          500: '#9A9080',
          600: '#6E6758',
        },
      },
      fontFamily: {
        // Cormorant Garamond — editorial serif for display/headings
        display: ['var(--font-cormorant)', 'Georgia', '"Times New Roman"', 'serif'],
        // DM Sans — refined modern body
        sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        // DM Mono — laboratory precision for numbers
        mono: ['var(--font-dm-mono)', '"Courier New"', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        // Fluid display sizes — design system tokens
        'display-hero': ['clamp(3.5rem, 9vw, 8rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      screens: {
        'xs': '480px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;