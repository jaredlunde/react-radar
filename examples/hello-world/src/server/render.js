import React from 'react'
import ReactDOMServer from 'react-dom/server'
import Radar from 'react-radar'
import createRenderer, {getScripts} from '@jaredlunde/example-server/react/createRenderer'
import App from '../App'


export default createRenderer({
  render: ({clientStats}) => async (req, res, next) => {
    try {
      // renders the app to a string
      const cache = Radar.createCache()
      const app = <App cache={cache} location={req.url}/>
      const page = await Radar.load(app, ReactDOMServer.renderToString)
      // sends the request
      res.set('Content-Type', 'text/html')
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Hello world app</title>
          <meta charset="utf-8">
          <meta
            name="viewport"
            content="width=device-width, user-scalable=yes, initial-scale=1.0"
          >
          ${getScripts(clientStats)}
          <script type="application/json" id="radar-cache">${cache}</script>
        </head>
        <body>
          <div id="⚛️">${page}</div>
        </body>
        </html>
      `)
    }
    catch (err) {
      console.log(err)
      res.send(`
        <center>
          <pre style='max-width: 400px;word-wrap: break-word;white-space: pre-wrap;text-align:left;'>${err}</pre>
        </center>
      `)
    }
  }
})
