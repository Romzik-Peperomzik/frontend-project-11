const HtmlWebpackPlugin = require('html-webpack-plugin'); // eslint-disable-line
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint-disable-line

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devServer: {
    port: 8001,
    open: true,
    hot: true,
  },
  module: {
    rules: [
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: 'index.html',
    }),
    new MiniCssExtractPlugin(),
  ],
};
