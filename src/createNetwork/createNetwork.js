import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
import postFetch from './post'


const REQUIRED_HEADERS = {'Content-Type': 'application/json; charset=utf-8'}
const DEFAULT_FETCH = {
  url: '/radar',
  method: 'POST',
  headers: {},
  timeout: 30 * 1000
}

const getRequestHeaders = ({body, headers}) => {
  let realHeaders

  if (typeof headers === 'function') {
    const promiseOrResult = headers(body)

    if (promiseOrResult && typeof promiseOrResult.then === 'function')
      return promiseOrResult
    else
      realHeaders = promiseOrResult
  } else {
    realHeaders = headers
  }

  // realHeaders = new Headers(realHeaders)
  return Promise.resolve(realHeaders || emptyObj)
}

const resolveSynchronously = promises => {
  // Has side-effects on @promises
  if (promises.length) {
    const [next, resolve] = promises[0]
    next.then(value => {
      resolve(value)
      promises.shift()
      resolveSynchronously(promises)
    })
  }
}

const removePendingUpdate = (pendingUpdates, PENDING_UPDATE) =>
  pendingUpdates.splice(pendingUpdates.indexOf(PENDING_UPDATE), 1)

export default props => {
  const pendingUpdates = []

  function post (body, context) {
    return new Promise(
      async resolve => {
        let {url, timeout, headers, ...opt} = Object.assign({}, DEFAULT_FETCH, props)
        timeout = timeout || 30 * 1000
        // we only use JSON requests
        opt.body = JSON.stringify(body)
        // sets user-defined headers
        headers = Object.assign({}, await getRequestHeaders({body, headers}))
        // sets headers from context
        if (typeof context === 'object' && context.headers !== void 0)
          headers = Object.assign(headers, context.headers)
        // sets required headers
        for (let name in REQUIRED_HEADERS)
          headers[name] = REQUIRED_HEADERS[name]
        // must be wrapped in CancelablePromise to make it cancelable
        const query = new Promise(
          resolve => postFetch(url, {...opt, headers}).then(resolve)
        )
        // creates a timeout for the fetch request
        const queryTimeout = setTimeout(
          function () {
            query.cancel()
            // resolves with a fake, but relevant response since there
            // was no real one
            resolve({
              ok: false,
              headers: emptyObj,
              status: 408,
              statusText: 'Request Timeout',
              json: false
            })

            removePendingUpdate(pendingUpdates, PENDING_UPDATE)
          },
          timeout
        )
        // wraps Promise.resolve with the timeout clearing func
        function resolver (...args) {
          // clears the fetch post timeout
          clearTimeout(queryTimeout)
          // resolves the promise
          resolve(...args)
        }

        if (context !== void 0 && context.async !== true) {
          // creates a pending, cancelable, synchronous update
          const PENDING_UPDATE = [query, resolver, queryTimeout]
          pendingUpdates.push(PENDING_UPDATE)
          // if this is the only pending query, go ahead and resolve it
          if (pendingUpdates.length === 1)
            resolveSynchronously(pendingUpdates)
        }
        else {
          // asynchronously resolves the query and adds it to state
          query.then(resolver)
        }
      }
    )
  }

  function abort () {
    while (pendingUpdates.length > 0) {
      const [promise, _, timeout] = pendingUpdates.shift()
      promise.cancel()
      clearTimeout(timeout)
    }
  }

  return endpoint => endpoint({post, abort})
}
