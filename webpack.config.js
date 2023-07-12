 
//const HtmlWebpackPlugin = require('html-webpack-plugin'); //installed via pnpm
//const webpack = require('webpack'); //to access built-in plugins
const path = require('path');

// The below config starts webpack at src/index.js. src/index.js includes src/bar.js, src/baz.js, src/button.js and src/foo.js so they are all bundled up together, which we tell it goes in the dist directory.

// Meanwhile, we tell the html-webpack-plugin to use views/index.html to create a new html file, dist/index.html, which injects a reference to the generated dist/main.js bundle.

// src/index.js also imports src/app.css and src/button.css which gets put into dist/main.js and loaded in dist/index.html.

module.exports = {
  // Which start file(s) to build the dependency graph from
  entry: {
    main: './src/index.js'
  },
  // Where Webpack should create the bundle(s) and what to call them.
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  // Tell Webpack how to transform files other than JS files - in this case we tell it what to do with .css files.
  /*
  module: {
    rules: [
      { test: /.css$/, loader: "style-loader!css-loader", include: __dirname + '/src' }
    ]
  },
  */
  // Plugins can do all sorts of tasks. The html-webpack-plugin generates an html file and injects the generated bundle.
  //plugins: [
  //  new HtmlWebpackPlugin({template: './views/index.html'})
  //]

  mode: 'development'
  //mode: 'production'

};
