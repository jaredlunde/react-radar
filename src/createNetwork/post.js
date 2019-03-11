import isNode from '../utils/isNode'


// POST w/ fetch or fetch polyfill
const post = self => (url, opt) => {
  if (typeof self.fetch === 'undefined') {
    // Tiny fetch() polyfill
    // Credit: Unfetch (Jason Miller)
    // https://github.com/developit/unfetch/blob/master/src/index.mjs
    self.fetch = (url, opt) => {
      const request = new self.XMLHttpRequest()

      return new self.Promise(
        (resolve, reject) => {
          const keys = [], headers = {}
          request.open('post', url, true)

          request.onload = () => {
            request.getAllResponseHeaders().replace(
              /^(.*?):[^\S\n]*([\s\S]*?)$/gm,
              (m, key, value) => {
                keys.push(key = key.toLowerCase())
                headers[key] = headers[key] ? headers[key] + ',' + value : value
              },
            )

            resolve({
              ok: (request.status / 100 | 0) === 2,		// 200-299
              statusText: request.statusText,
              status: request.status,
              url: request.responseURL,
              json: () => self.Promise.resolve(self.JSON.parse(request.responseText)),
              headers: {
                keys: () => keys,
                forEach: fn => {
                  for (let i = 0; i < keys.length; i++) fn(headers[keys[i]], keys[i])
                }
              },
            })
          }

          request.onerror = reject
          request.withCredentials = opt.credentials === 'include'

          for (const i in opt.headers) request.setRequestHeader(i, opt.headers[i]);
          request.send(opt.body || null)
        }
      )
    }
  }

  return self.fetch(url, opt).then(
    r => {
      let headers = {}
      r.headers.forEach((value, name) => headers[name] = value)

      return r.json().then(
        json => (
          {
            ok: r.ok,
            url,
            headers,
            status: r.status,
            statusText: r.statusText,
            json: r.ok === true ? json : false,
          }
        ),
      )
    },
  ).catch(
    errorMsg => self.Promise.resolve({
      ok: false,
      url,
      headers: {},
      status: 520,
      statusText: 'Unknown Error',
      errorMsg: String(errorMsg),
      json: false,
    }),
  )
}

let fetcher

const workerCode = `this.onmessage=function(e){(${Function.prototype.toString.call(post)})(self).apply(null,e.data.params).then(function(r){postMessage({type:'RPC',id:e.data.id,result:r});});};`

if (isNode === false && typeof Worker !== 'undefined') {
  let blob

  try {
    blob = new Blob([workerCode], {type: 'application/json'})
  }
  catch (e) {
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

  worker.onmessage = e => {
    callbacks[e.data.id](e.data.result)
  }

  fetcher = (...args) => new Promise(resolve => {
    let id = `rpc${++counter}`
    callbacks[id] = resolve
    worker.postMessage({type: 'RPC', id, params: args})
  })
}
else {
  fetcher = post(typeof window === 'undefined' ? global : window)
}

export default fetcher
