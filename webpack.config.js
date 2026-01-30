const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack'); // 1. IMPORTAR EL PLUGIN

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new Dotenv({
      path: './.env',    // Indica la ruta de tu archivo local
      systemvars: true,  // ¡CLAVE! Permite usar las variables que cargaste en el panel de Vercel
      silent: true       // Evita que el build falle si no encuentra el archivo .env físico
    }), 
  ],
  devServer: {
    port: 3000,
    hot: true,
    open: true,
  },
}