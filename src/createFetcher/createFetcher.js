import emptyObj from 'empty/object'
import Promise from 'cancelable-promise'
import {getQueryRequestPayload, getEndpointProps} from '../createEndpoint/utils'
import DEFAULT_FETCH from '../createNetworking/DEFAULT_FETCH'
import REQUIRED_HEADERS from '../createNetworking/REQUIRED_HEADERS'
import {getRequestHeaders} from '../createNetworking/utils'
import post, {fakeJSONResponse} from '../createNetworking/post'

/**
import {createFetcher} from 'react-radar'

const stateFetcher = createFetcher([fetchOpt])

function serverRenderer () {
  ...
  const initialState = await stateFetcher(Endpoint, endpointProps, headers)

  const html = ReactDOMServer.renderToString(
    <App router={Router} location={req.url} initialState={initialState}/>
  )
  ...
}
*/

export function parseState (id = 'app.initialState') {
  const el = typeof document !== 'undefined' && document.getElementById(id)

  if (el) {
    let initialState

    try {
      initialState = JSON.parse(el.textContent)
    }
    catch (e) {
      initialState = {}
    }

    if (initialState) {
      initialState.isDOM = true
    }

    return initialState
  }

  return null
}


export default function createFetcher (props) {
  const fetch = props || emptyObj

  return function fetcher (endpoint, props, additionalHeaders = emptyObj) {
    if (!endpoint) {
      // bails out if there was no endpoint
      return null
    }

    const {name, fetch, defaultProps, queries, reducer} = endpoint.meta
    const queryProps = getEndpointProps(defaultProps, emptyObj, props)
    const body = getQueryRequestPayload(queries, queryProps)

    //bails out if there were no queries, otherwise processes the queries
    return body === null ? new Promise(resolve => resolve(null)) : new Promise(
      async (resolve, reject) => {
        let {url, timeout, headers, ...opt} = {...DEFAULT_FETCH, ...fetch}
        timeout = timeout || 30 * 1000
        // we only use JSON requests
        opt.body = JSON.stringify(body)
        // sets user-defined headers
        headers = {...headers, ...additionalHeaders}
        headers = await getRequestHeaders({body, headers})
        // sets required headers
        for (let name in REQUIRED_HEADERS) {
          headers.set(name, REQUIRED_HEADERS[name])
        }
        // creates the fetch post
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
          },
          timeout
        )
        // wait for the query to finish before resolving
        const response = await query
        let nextState = {}

        try {
          nextState = await response.json()
        }
        catch (e) {
          nextState = {}
        }

        delete response.body
        delete response._raw

        // clears the fetch post timeout
        clearTimeout(queryTimeout)
        // resolves the promise with the response
        resolve({
          reducer,
          nextState,
          response: {
            // url: response.url,
            headers: response.headers,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            size: response.size,
            timeout: response.timeout
          },
          queries,
          queryProps: {...queryProps, __SERVER__: true},
          endpoint: endpoint.meta.name,
          type: 'QUERY',
          isInitial: true
        })
      }
    )
  }
}
