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
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      colors: {
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
