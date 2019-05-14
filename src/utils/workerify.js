const CancelablePromise = require('cancelable-promise').default


const workerTemplate = `this.onmessage=function(e){(<code>)(self).apply(null,e.data.args).then(function(r){postMessage({type:'RPC',id:e.data.id,result:r});}).catch(function(e){postMessage({type:'RPC',id:e.data.id,error:e});});};`

export default fn => {
  if (typeof window !== 'undefined') {
    if (window.Promise === void 0)
      window.Promise = CancelablePromise

    if (typeof Worker !== 'undefined') {
      const workerCode = workerTemplate.replace('<code>', Function.prototype.toString.call(fn))
      let blob

      try {
        blob = new Blob([workerCode], {type: 'application/json'})
      } catch (e) {
        window.BlobBuilder = window.BlobBuilder
          || window.WebKitBlobBuilder
          || window.MozBlobBuilder
        blob = new BlobBuilder()
        blob.append(workerCode)
        blob = blob.getBlob()
      }

      let worker = new Worker((window.URL || window.webkitURL).createObjectURL(blob)),
          counter = 0,
          callbacks = {}

      worker.onmessage = e => e.data.error === void 0
        ? callbacks[e.data.id][0](e.data.result)
        : callbacks[e.data.id][1](e.data.error)

      return (...args) => new CancelablePromise((resolve, reject) => {
        let id = `rpc${++counter}`
        callbacks[id] = [resolve, reject]
        worker.postMessage({type: 'RPC', id, args: args})
      })
    }

    return fn(window)
  }

  return fn(global)
}