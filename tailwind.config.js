/** @type {import('tailwindcss').Config} */

const scale = (name) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `var(--color-${name}-${step})`,
    ])
  );

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    /* Flat UI: disable Tailwind default elevation shadows (focus rings use separate vars). */
    boxShadow: {
      sm: 'none',
      DEFAULT: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      '2xl': 'none',
      inner: 'none',
      none: 'none',
    },
    extend: {
      // C3: interactive surfaces use --radius-sm (see frontend skill). Tailwind's
      // rounded-md is often used for controls; map it to sm so md ≠ oversized corners.
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      colors: {
        /** Semantic divider/border — matches `border-weak` utility; use with `divide-*` as `divide-border-weak`. */
        'border-weak': 'var(--color-border-weak)',
        gray: scale('gray'),
        blue: scale('blue'),
        red: scale('red'),
        green: scale('green'),
        orange: scale('orange'),
        yellow: scale('yellow'),
        amber: scale('yellow'),
        indigo: {
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
          700: 'var(--color-blue-700)',
        },
      },
    },
  },
  plugins: [],
};
