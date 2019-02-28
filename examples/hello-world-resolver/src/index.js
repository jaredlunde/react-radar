import {createAPI} from '@jaredlunde/example-server/api'
import express from 'express'
import cors from 'cors'
import cookies from 'cookie-parser'
import * as config from './config'
import {resolver} from './radar'


export default createAPI({
  OPTIONS: {
    '/1.0./radar': (req, res) => {
      res.set('Access-Control-Allow-Origin', '*')
    }
  },
  POST: {
    '/1.0/radar': resolver.handler
  },
  middleware: [express.json(), cookies(), cors(config.cors)]
})
