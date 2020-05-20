const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  devServer: {
    port: 9000,
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    hot: true,
    liveReload: true,
    open: true,
    openPage: 'index.html',
    proxy: {
      '/map': 'http://localhost:9999',
      '/maps': 'http://localhost:9999',
      '/export': 'http://localhost:9999',
      '/*.png': 'http://localhost:9999',
      '/*.txt': 'http://localhost:9999',
      '/*.json': 'http://localhost:9999',
    },
  },
};
