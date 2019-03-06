import Promise from 'cancelable-promise'
import {getRequestHeaders, resolveSynchronously} from './utils'
import emptyObj from 'empty/object'
import fetcher from './fetcher'


const REQUIRED_HEADERS = {'Content-Type': 'application/json; charset=utf-8'}
const DEFAULT_FETCH = {
  url: '/radar',
  method: 'POST',
  headers: {},
  timeout: 30 * 1000
}

function removePendingUpdate (pendingUpdates, PENDING_UPDATE) {
  return pendingUpdates.splice(pendingUpdates.indexOf(PENDING_UPDATE), 1)
}

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
        headers = await getRequestHeaders({body, headers})
        // sets headers from context
        if (context && context.headers) {
          headers = Object.assign(headers, context.headers)
        }
        // sets required headers
        for (let name in REQUIRED_HEADERS) {
          headers[name] = REQUIRED_HEADERS[name]
        }
        // must be wrapped in CancelablePromise to make it cancelable
        const query = new Promise(
          resolve => fetcher.post(url, {...opt, headers}).then(resolve)
        )
        // creates a timeout for the fetch request
        const queryTimeout = setTimeout(
          function () {
            // console.log('[Fetch] query timed out:', query)
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
        // creates a pending, cancelable update
        const PENDING_UPDATE = [query, resolver, queryTimeout]
        pendingUpdates.push(PENDING_UPDATE)
        // if this is the only pending query, go ahead and resolve it
        if (pendingUpdates.length === 1) {
          resolveSynchronously(pendingUpdates)
        }
      }
    )
  }

  function abort () {
    while (pendingUpdates.length) {
      const [promise, re, rj, timeout] = pendingUpdates.shift()
      promise.cancel()
      clearTimeout(timeout)
    }
  }

  function Network (endpoint) {
    return endpoint({post, abort})
  }

  return Network
}
