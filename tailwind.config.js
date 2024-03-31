/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      opacity: {
        25: '.25',
        85: '.85',
      },
      colors: {
        mainOrange: { 100: '#E66032' },
        mainBg: { 100: '#CDD3CE' },
      },
      screens: {},
    },
    screens: {
      xxl: { max: '1550px' },
      xl: { max: '1260px' },
      lg: { max: '1024px' },
      mdLg: { max: '920px' },
      md: { max: '820px' },
      smMd: { max: '540px' },
      sm: { max: '430px' },

      landscapePhone: {
        raw: `only screen and (orientation: landscape) and (max-width: 920px) and (max-height: 768px)`,
      },
      laptop: {
        raw: `only screen and (max-height: 859px) and (min-width: 1400px) `,
      },
      smallLaptop: {
        raw: `only screen and (max-height:650px) and (min-width:921px) and (orientation: landscape)`,
      },
      landscapePad: {
        raw: `only screen and  (min-width: 920px) and (max-width: 1370px) and (min-height:630px) and (orientation: landscape)`,
      },

      portraitPad: {
        raw: `only screen and (max-width: 920px) and (orientation: portrait)`,
      },
      portraitPh: {
        raw: `only screen and (max-width: 550px)`,
      },
      shortPhone: {
        raw: `only screen and (max-height: 700px) and (max-width: 430px)`,
      },
      xsPhone: {
        raw: `only screen and  (max-width: 350px)`,
      },
    },
  },
  plugins: [],
}
