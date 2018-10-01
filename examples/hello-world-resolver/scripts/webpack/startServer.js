const path = require('path')
const chalk = require('chalk')
const express = require('express')
const compression = require('compression')
const noFavicon = require('express-no-favicons')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotServerMiddleware = require('webpack-hot-server-middleware')


module.exports = function startServer ({
  config, // dev webpack server config
  port = 3000,  // the local port to run the dev server on
  host = '127.0.0.1'
}) {
  // creates the app env
  const app = express()
  // prevents favicons from being sent to the renderer
  app.use(noFavicon())

  let isBuilt = false
  // express listener which is run after the compiler is done
  function startListening () {
    if (isBuilt === false) {
      app.listen(
        parseInt(port),
        host,
        () => {
          isBuilt = true
          console.log(chalk.green(`[Radar Resolver] ${host}:${port}`))
        }
      )
    }
  }

  const compiler = webpack([config])
  const [serverCompiler] = compiler.compilers

  // additional compiler options
  const options = {
    compress: true,
    historyApiFallback: true,
    noInfo: true
  }

  // attaches dev middleware to the express app
  const instance = webpackDevMiddleware(compiler, options)
  app.use(instance)
  app.use(webpackHotServerMiddleware(compiler, {reload: true, chunkName: 'm'}))

  // taps into the webpack hook to start the express app once it has finished
  // compiling
  instance.waitUntilValid(startListening)
}
