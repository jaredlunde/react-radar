import React from 'react'
import Promise from 'cancelable-promise'
import DEFAULT_FETCH from './DEFAULT_FETCH'
import REQUIRED_HEADERS from './REQUIRED_HEADERS'
import memoize from 'fast-memoize'
import {getRequestHeaders, resolveSynchronously} from './utils'
import post, {fakeJSONResponse} from './post'
import emptyObj from 'empty/object'


function removePendingUpdate (pendingUpdates, PENDING_UPDATE) {
  return pendingUpdates.splice(pendingUpdates.indexOf(PENDING_UPDATE), 1)
}


function createNetworking (networkID/**Must be unique to avoid bad cancellations on pendingUpdates*/) {
  const pendingUpdates = []

  function Networking (props) {
    const fetch = props.fetch || emptyObj

    function send (body) {
      return new Promise(
        async (resolve, reject) => {
          let {url, timeout, headers, ...opt} = {...DEFAULT_FETCH, ...fetch}
          timeout = timeout || 30 * 1000
          // we only use JSON requests
          opt.body = JSON.stringify(body)
          // sets user-defined headers
          headers = await getRequestHeaders({body, headers})
          // sets required headers
          for (let name in REQUIRED_HEADERS) {
            headers.set(name, REQUIRED_HEADERS[name])
          }
          // creates the fetch post
          // console.log('[Fetch] post:', url)
          const query = post(url, {...opt, headers})
          // creates a timeout for the fetch request
          const queryTimeout = setTimeout(
            function () {
              // console.log('[Fetch] query timed out:', query)
              query.cancel()
              // resolves with a fake, but relevant response since there
              // was no real one
              resolve({
                ok: false,
                status: 408,
                statusText: 'Request Timeout',
                json: fakeJSONResponse
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
          const PENDING_UPDATE = [query, resolver, reject, queryTimeout]
          pendingUpdates.push(PENDING_UPDATE)
          // if this is the only pending query, go ahead and resolve it
          if (pendingUpdates.length === 1) {
            resolveSynchronously(pendingUpdates)
          }
        }
      )
    }

    function abort () {
      // aborts all pending updates
      // if (pendingUpdates.length) {
      //   console.log('[Fetch] aborted ', pendingUpdates.length, 'queries')
      // }

      while (pendingUpdates.length) {
        const [promise, resolve, reject, timeout] = pendingUpdates.shift()
        promise.cancel()
        clearTimeout(timeout)
      }
    }

    return props.children({send, abort})
  }

  if (__DEV__) {
    Networking.displayName = `Networking(${networkID})`
  }

  return Networking
}


const networkMemoizer = memoize(createNetworking)

/**
 * Wrapped because we don't want to memoize on objects but we want a
 * consistent api
 */
export default function (opt) {
  return networkMemoizer(opt.name)
}
