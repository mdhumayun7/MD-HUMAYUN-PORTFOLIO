/** @type {import('tailwindcss').Config} */

// ---------------------------------------------------------------------------
// COLOURS ARE NOT DEFINED HERE.
// Every colour below points at a CSS variable declared in src/index.css.
// That is what makes dark mode work without duplicating class names.
// To change a colour, edit src/index.css (or src/config/site.js which
// documents the same values) -- not this file.
// ---------------------------------------------------------------------------
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        fg: 'var(--c-fg)',
        accent: 'var(--c-accent)',
        'accent-soft': 'var(--c-accent-soft)',
        muted: 'var(--c-grey-500)',
        line: 'var(--c-grey-200)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Modular scale, ratio 1.25 (major third), 17px base.
      // The four largest steps use clamp() so headings scale continuously
      // across phone -> tablet -> desktop instead of jumping at one
      // breakpoint; the viewport term is tuned to the max-w-shell content
      // width so it stops growing once the layout does.
      fontSize: {
        micro: ['0.8125rem', { lineHeight: '1.5' }],   // 13
        small: ['0.9375rem', { lineHeight: '1.6' }],   // 15
        base: ['1.0625rem', { lineHeight: '1.65' }],   // 17
        lead: ['clamp(1.15rem, 1.05rem + 0.5vw, 1.3125rem)', { lineHeight: '1.5' }],   // 18.4 -> 21
        h4: ['clamp(1.35rem, 1.15rem + 1vw, 1.625rem)', { lineHeight: '1.28' }],       // 21.6 -> 26
        h3: ['clamp(1.6rem, 1.25rem + 1.75vw, 2.0625rem)', { lineHeight: '1.18' }],    // 25.6 -> 33
        h2: ['clamp(1.85rem, 1.3rem + 2.75vw, 2.5625rem)', { lineHeight: '1.1' }],     // 29.6 -> 41
        h1: ['clamp(2.15rem, 1.3rem + 4.25vw, 3.1875rem)', { lineHeight: '1.03' }],    // 34.4 -> 51
      },
      // Spacing scale used for section rhythm.
      spacing: {
        section: '7rem',
        'section-sm': '4.5rem',
      },
      maxWidth: {
        prose: '68ch',
        shell: '78rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
