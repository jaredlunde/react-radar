const path = require('path')
const startServer = require('./webpack/startServer')
const createConfig = require('./webpack/createConfig')


const config = createConfig({
  name: 'server',
  mode: 'development',
  entry: {m: path.join(__dirname, '../src/index.js')},
  output: {
    path: path.join(__dirname, '../dist/'),
    filename: 'handler.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    alias: {
      'node-fetch$': 'node-fetch/lib/index.js'
    }
  },
  externals: ['express', 'encoding']
})


startServer({config})
