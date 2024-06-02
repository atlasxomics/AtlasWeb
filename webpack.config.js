const path = require('path')
module.exports = {
  resolve: {
    symlinks: false,
    alias: {
      'vue$': path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js'),
      '^vuetify': path.resolve(__dirname, 'node_modules/vuetify'),
      '@components': path.resolve(__dirname, 'src/components/')
    }
  }
}