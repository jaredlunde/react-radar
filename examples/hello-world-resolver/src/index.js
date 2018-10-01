import express from 'express'
import cors from 'cors'
import cookies from 'cookie-parser'
import * as config from './config'
import {resolver} from './radar/resolvers'




export default () => {
  // initializes express
  const app = express()

  // disables x-powered-by: express header for security reasons
  app.disable('x-powered-by')
  // applies standard middleware
  app.use(
    // parses JSON bodies
    express.json(),
    // cookie parser enabler
    cookies(),
    // enables CORS requests
    cors(config.cors)
  )
  // server test handler
  app.get(
    '/ping/:pong',
    function (req, res, next) {
      res.json({pong: req.params.pong})
    }
  )
  // radar handler
  app.post('/1.0/radar', resolver.handler)

  return app
}
