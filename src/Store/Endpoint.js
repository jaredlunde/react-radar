import React, {useRef, useEffect, useReducer} from 'react'
import {useCallbackOne, useMemoOne} from 'use-memo-one'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {stringify} from '../createRecord'
import {invariant, isNode} from '../utils'
import {createKeyObserver} from './utils'
import {EndpointContext, EndpointInternalContext} from './EndpointContext'
import createCache from './createCache'


export const WAITING = 0
export const ERROR = 1
export const LOADING = 2
export const DONE = 3
export const getQueryId = memoize([WeakMap], query => {
  if (__DEV__) {
    invariant(
      query.reducer.id,
      `Query reducers need to define a unique 'id' property to avoid errors ` +
      `in hydrating SSR applications. e.g. yourReducer.id = 'yourReducer'. ` +
      `It is recommended, however, that you use the 'createReducer' function ` +
      `to ensure backwards compatibility.`
    )
  }

  let props = {}, requires = {}
  Object.keys(query.params).sort().forEach(k => props[k] = query.params[k])
  Object.keys(query.requires || emptyObj).sort().forEach(
    k => requires[k] = query.requires[k].requiresFields
  )

  return `${query.name}(${JSON.stringify(props)}) => ${query.reducer.id}(${stringify(requires)})`
})

let defaultCache
const getDefaultCache = () => {
  if (defaultCache === void 0)
    defaultCache = createCache()
  return defaultCache
}
export const normalizeQueries = queries => Array.isArray(queries) === true ? queries : [queries]
const init = () => ({value: new Map()})

/**
 * The Endpoint component is the glue that binds together the networking layer, store,
 * and queries
 */
const Endpoint = ({cache = getDefaultCache(), network, dispatch, children}) => {
  cache = useRef(cache)
  const
    keyObserver = useMemoOne(() => ({current: createKeyObserver()})),
    listeners = useRef(new Map())
  // processes incoming queries
  const processQueries = useCallbackOne(
    async (queries, options) => {
      let payload = [], i = 0

      for (i = 0; i < queries.length; i++) {
        const query = queries[i]

        if (query.local !== true) {
          // attaches payload object for network queries
          const requires = {}
          for (let key in query.requires)
            requires[key] = query.requires[key].requiresFields
          payload.push({name: query.name, props: query.params, requires})
        }
      }

      if (payload.length > 0) {
        // resolves the commit promise
        let
          response = await network.post(payload, options),
          nextState = response.json
        // We only want to perform state updates with setState in the browser.
        // On the server side we use the query cache and multiple iterations to populate the
        // data in the tree.
        if (isNode === false) {
          dispatch(state => {
            // function which executes rollbacks on queries that need them
            let rollbacks = []

            switch (response.status) {
              case   0:
              case 200:
                for (i = 0; i < queries.length; i++)
                  if (response?.json?.[i]?.isRadarError === true)
                    rollbacks.push(queries[i])
                break
              default:
                // executes rollbacks on the failed mutations
                rollbacks = queries.slice(0)
            }

            if (rollbacks.length > 0) {
              nextState = nextState || []

              for (i = 0; i < rollbacks.length; i++) {
                const query = rollbacks[i]
                if (query === void 0) continue
                if (typeof query.rollback === 'function') {
                  // optimistic updates can rollback on errors
                  queries.unshift(query)
                  nextState.unshift(query.rollback(query.input, state, query))
                }
              }
            }

            return Object.assign({nextState, queries, response}, options)
          })
        }
        // if the response was not a 200 response it is considered an error status
        const status = response.ok === true ? DONE : ERROR
        // updates the cache for each query
        for (i = 0; i < queries.length; i++) {
          const oneResponse = Object.assign({}, response)
          oneResponse.json = response?.json?.[i]
          cache.current.set(getQueryId(queries[i]), {status, response: oneResponse})
        }

        return response
      }
    },
    emptyArr
  )
  // commits queries from the query cache to the store
  const commitFromCache = useCallbackOne(
    (queries, options = emptyObj) => {
      queries.length > 0 && dispatch(() => {
        let nextState = [], cachedQueries = [], i = 0

        for (; i < queries.length; i++) {
          const query = queries[i], cached = cache.current.get(getQueryId(query))
          if (cached?.response?.json) {
            cachedQueries.push(query)
            nextState.push(cached.response.json)
          }
        }

        return {nextState, queries: cachedQueries, ...options, type: options.type || 'update'}
      })
    },
    emptyArr
  )
  // commits local updates to the store
  const commitLocal = useCallbackOne(
    (queries, options = emptyObj) /*{type, queries}*/=> {
      // TODO: pass record state than the application state to optimistic and rollback
      //       when performing record updates. getting the state of the record will
      //       require knowing its key, which would be an api change
      queries = normalizeQueries(queries)
      queries.length > 0 && dispatch(
        state => {
          let nextState = [], i = 0

          for (; i < queries.length; i++) {
            const query = queries[i]
            if (typeof query.optimistic === 'function')
              nextState.push(query.optimistic(query.input, state, query))
            else
              nextState.push(emptyObj)
            cache.current.set(getQueryId(query), {status: DONE})
          }

          return {nextState, queries, ...options, type: options.type || 'update'}
        }
      )
    },
    emptyArr
  )
  // routes the various query types to their proper committer
  const commit = useCallbackOne(
    async (queries, options = emptyObj) => {
      queries = normalizeQueries(queries)
      if (isNode === false) {
        let optimisticQueries = [],  i = 0
        for (; i < queries.length; i++) {
          const query = queries[i]
          if (typeof query.optimistic === 'function' || query.local !== false)
            optimisticQueries.push(query)
        }
        // commits an optimistic updates first but not on the server
        commitLocal(optimisticQueries, options)
      }
      // commits the payloads to the network
      if (options.async === true) {
        let promises = [], i = 0
        for (; i < queries.length; i++)
          promises.push(processQueries(queries.slice(i, i + 1), options))
        return Promise.all(promises)
      }

      return processQueries(queries, options)
    },
    emptyArr
  )
  // This notification callback is passed to the cache. It's fired each time the cache
  // updates.
  const notify = useCallbackOne(
    (id, query) => dispatchQueryState({type: 'update', id, query}),
    emptyArr
  )
  // creates a child context for queries to consume
  const reducer = (state, {type, id, query}) => {
    let nextState = state, numListeners

    switch (type) {
      case 'subscribe':
        numListeners = listeners.current.get(id)
        if (numListeners === void 0) {
          // adds this endpoint to the cache's listeners
          cache.current.subscribe(id, notify)
          // sets the query in state
          numListeners = 0
          state.value.set(id, cache.current.get(id))
          // used for calculating changed bits for context
          keyObserver.current.setShard(id)
        }
        listeners.current.set(id, ++numListeners)
        break
      case 'unsubscribe':
        numListeners = listeners.current.get(id)
        listeners.current.set(id, --numListeners)
        if (numListeners === 0) {
          cache.current.unsubscribe(id, notify)
          listeners.current.delete(id)
          state.value.delete(id)
        }
        break
      case 'update':
        state.value.set(id, Object.assign(state.value.get(id), query))
        nextState = {value: state.value}
        break
      default:
        throw new Error(`Unrecognized type: "${type}"`)
    }

    return nextState
  }

  const [queryState, dispatchQueryState] = useReducer(reducer, null, init)
  const childContext = useMemoOne(
    () => ({
      queries: queryState,
      getCached: cache.current.get.bind(cache.current),
      setCached: cache.current.set.bind(cache.current),
      getBits: keyObserver.current.getBits,
      commit,
      commitLocal,
      commitFromCache,
      dispatch: dispatchQueryState
    }),
    [queryState, cache.current]
  )
  // handles 'unmount'
  useEffect(
    () => () => {
      // aborts any pending network requests
      network.abort()
      // unsubscribes notifiers from the query cache on unmount
      for (let id of listeners.current.keys())
        cache.current.unsubscribe(id, notify)
    },
    emptyArr
  )
  // garbage collects the cache each update
  // TODO: this should not be needed due to ref counting.... but we'll see
  // useEffect(() => { cache.current.collect() } , [queries.current])
  // useEffect(() => { console.log('Current listeners:', listeners.current) })
  return <EndpointInternalContext.Provider
    value={keyObserver.current.getBits}
    children={<EndpointContext.Provider value={childContext} children={children}/>}
  />
}


if (__DEV__)
  Endpoint.propTypes = {
    cache: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    network: PropTypes.shape({
      post: PropTypes.func.isRequired,
      abort: PropTypes.func.isRequired,
    }).isRequired
  }

export default Endpoint
