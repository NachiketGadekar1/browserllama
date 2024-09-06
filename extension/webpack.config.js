const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './content-script.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'content-script.bundle.js'
  }
};

module.exports = config;