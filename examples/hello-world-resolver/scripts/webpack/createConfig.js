const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const WriteFilePlugin = require('write-file-webpack-plugin')

module.exports = function createConfig (...configs) {
  let config = merge.smartStrategy({'module.rules': 'prepend'})(...configs)

  const mainFields = ['module', 'jsnext', 'esnext', 'jsnext:main', 'main']

  return merge.smartStrategy({'module.rules': 'prepend'})(
    {
      devtool: process.env.NODE_ENV !== 'production' ? 'eval' : false,
      target: 'node',

      // The base directory for resolving the entry option
      output: {
        publicPath: '/public/',
        pathinfo: true
      },

      // Where to resolve our loaders
      resolveLoader: {
        modules: ['node_modules'],
        moduleExtensions: ['-loader'],
      },

      resolve: {
        // Directories that contain our modules
        symlinks: false,
        modules: ['node_modules'],
        mainFields,
        descriptionFiles: ['package.json'],
        // Extensions used to resolve modules
        extensions: ['.mjs', '.js', '.jsx'],
      },
      module: {
        rules: [
          {
            test: /(\.js|\.jsx)$/,
            use: {
              loader: 'babel',
              options: {
                cacheDirectory: false,
                presets: [
                  [
                    '@inst-app/esx', {
                      env: {
                        useBuiltIns: "usage",
                        loose: true,
                        modules: false,
                        targets: {"node": "current"}
                      },
                      "runtime": {corejs: 2}
                    }
                  ]
                ],
                comments: process.env.NODE_ENV === 'development'
              }
            },
            exclude: /node_modules/
          }
        ]
      },

      // Include mocks for when node.js specific modules may be required
      node: {
        fs: 'empty',
        vm: 'empty',
        net: 'empty',
        tls: 'empty'
      },

      plugins: [WriteFilePlugin()]
    },
    config
  )
}
