let fetcher

if (typeof Worker !== 'undefined') {
  fetcher = require('workerize-loader!./post')
}

if (typeof Worker === 'undefined') {
  fetcher = () => require('./post')
}

export default fetcher()
