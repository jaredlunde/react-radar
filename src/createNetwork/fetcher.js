import isNode from '../utils/isNode'


let fetcher

if (isNode === false) {
  // fetcher = require('workerize-loader!./post')
  fetcher = require('workerize-loader?inline!./post')
}

if (typeof Worker === 'undefined') {
  fetcher = () => require('./post')
}

export default fetcher()
