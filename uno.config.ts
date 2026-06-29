import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      magenta: {
        50: '#fce4f0',
        100: '#f9c2dd',
        200: '#f59bc9',
        300: '#f174b5',
        400: '#ed4da1',
        500: '#e20074',   // Telekom brand magenta
        600: '#c40064',
        700: '#a60054',
        800: '#880044',
        900: '#6a0034',
      },
    },
  },
})
