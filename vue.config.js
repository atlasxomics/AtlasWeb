// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  devServer: {
    port: 5000
  },
  chainWebpack: (config) => {
    config.module
      .rule('raw')
      .test(/\.txt$|\.md$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();
  },
  configureWebpack: { resolve: { alias: { vue$: path.resolve(__dirname, './node_modules/vue/dist/vue.esm.js') } },  entry: { app: './src/main.ts' } },
};