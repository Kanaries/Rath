module.exports = {
  purge: [
    "./src/**/*.tsx"
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    minWidth: {
      '96': '96px'
    },
    extend: {},
  },
  variants: {
    extend: {
      'backgroundColor': ['disabled']
    },
  },
  plugins: [],
}
