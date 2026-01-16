const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 1. Entrada: donde arranca la app
  entry: './src/index.js',

  // 2. Salida: donde se guarda el bundle final
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js', // El hash ayuda con el caché del navegador
    clean: true, // Limpia la carpeta dist en cada build
  },

  // 3. Extensiones que Webpack debe reconocer
  resolve: {
    extensions: ['.js', '.jsx'],
  },

  // 4. Reglas de transformación (Loaders)
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
        use: ['style-loader', 'css-loader'], // Para poder importar archivos CSS en JS
      },
    ],
  },

  // 5. Plugins adicionales
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Usa nuestro HTML como base
    }),
  ],

  // 6. Servidor de desarrollo (Estilo Vite)
  devServer: {
    port: 3000,
    hot: true,
    open: true,
  },
}