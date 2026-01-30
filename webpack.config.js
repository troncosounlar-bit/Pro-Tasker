const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/', // Ayuda a que las rutas de imágenes no se rompan en despliegue
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
      // --- ESTA ES LA REGLA QUE SOLUCIONA EL ERROR DEL LOGO ---
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]', // Organiza las imágenes en una carpeta assets dentro de dist
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new Dotenv({
      path: './.env',
      systemvars: true,
      silent: true 
    }), 
  ],
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true, // Útil para que no de 404 al recargar rutas en React
  },
};