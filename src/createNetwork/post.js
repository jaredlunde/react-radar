import CancelablePromise from 'cancelable-promise'

// POST w/ fetch or fetch polyfill
const
  window_ = typeof window === 'undefined' ? global : window,
  headersRe = /^(.*?):[^\S\n]*([\s\S]*?)$/gm
const post = (url, opt) => {
  let fetch = window_.fetch
  if (typeof fetch === 'undefined') {
    // Tiny fetch() polyfill
    // Credit: Unfetch (Jason Miller)
    // https://github.com/developit/unfetch/blob/master/src/index.mjs
    fetch = (url, opt) => {
      const request = new XMLHttpRequest()

      return new CancelablePromise(
        (resolve, reject) => {
          const keys = [], headers = {}
          request.open('post', url, true)
          request.onload = () => {
            request.getAllResponseHeaders().replace(
              headersRe,
              (m, key, value) => {
                keys.push(key = key.toLowerCase())
                headers[key] = headers[key] ? `${headers[key]},${value}` : value
              },
            )

            resolve({
              ok: (request.status / 100 | 0) === 2,		// 200-299
              statusText: request.statusText,
              status: request.status,
              url: request.responseURL,
              json: () => CancelablePromise.resolve(JSON.parse(request.responseText)),
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

  return fetch(url, opt).then(
    r => {
      let headers = {}
      r.headers.forEach((value, name) => headers[name] = value)

      return !r.ok ? ({
        ok: r.ok,
        url,
        headers,
        status: r.status,
        statusText: r.statusText,
        json: null,
      }) : r.json().then(
        json => ({
          ok: r.ok,
          url,
          headers,
          status: r.status,
          statusText: r.statusText,
          json,
        }),
      )
    },
  ).catch(
    errorMsg => CancelablePromise.resolve({
      ok: false,
      url,
      headers: {},
      status: 520,
      statusText: 'Unknown Error',
      errorMsg: String(errorMsg),
      json: false,
    })
  )
}

export default post
