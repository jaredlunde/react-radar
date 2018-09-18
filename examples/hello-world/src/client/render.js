import React from 'react'
import ReactDOM from 'react-dom'
import {createCache} from 'react-radar'
import App from '../App'


function hydrate (App) {
  const app = <App cache={createCache()}/>
  ReactDOM.hydrate(app, document.getElementById('⚛️'))
}

module.hot && module.hot.accept('../App', () => hydrate(require('../App').default))
hydrate(App)
