const path = require('path')
const {startServer, createConfig} = require('@jaredlunde/example-server/api')


const config = createConfig({
  entry: {m: path.join(__dirname, '../src/index.js')},
  output: {
    path: path.join(__dirname, '../dist/'),
  },
  resolve: {
    alias: {
      'node-fetch$': 'node-fetch/lib/index.js'
    }
  }
})


startServer({config})
