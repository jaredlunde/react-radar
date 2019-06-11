import React, {useRef, useEffect, useReducer} from 'react'
import {useMemoOne} from 'use-memo-one'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {stringify} from '../createRecord'
import {invariant, isNode} from '../utils'
// import {createKeyObserver} from './utils'
// import {EndpointContext, EndpointInternalContext} from './EndpointContext'
import {EndpointContext} from './EndpointContext'
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
export const normalizeQueries = queries =>
  !queries ? emptyArr : Array.isArray(queries) === true ? queries : [queries]
const init = () => ({value: new Map()})
const reducer = (state, action) => {
  const {type, id, query} = action
  let nextState = state

  switch (type) {
    case 'add':
      state.value.set(id, query)
      break
    case 'delete':
      state.value.delete(id)
      break
    case 'update':
      state.value.set(id, query)
      nextState = {value: state.value}
      break
    default:
      throw new Error(`Unrecognized type: "${type}"`)
  }

  return nextState
}

/**
 * The Endpoint component is the glue that binds together the networking layer, store,
 * and queries
 */
const Endpoint = ({cache = getDefaultCache(), network, dispatchState, children}) => {
  cache = useRef(cache)
  const listeners = useRef(new Map())
    // keyObserver = useMemoOne(() => ({current: createKeyObserver()}))

  // processes incoming queries
  const processQueries = useRef(
    async (queries, options) => {
      let payload = [], i = 0

      for (; i < queries.length; i++) {
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
          dispatchState(state => {
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
    }
  )
  // commits queries from the query cache to the store
  const commitFromCache = useRef(
    (queries, options = emptyObj) => {
      queries.length > 0 && dispatchState(() => {
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
    }
  )
  // commits local updates to the store
  const commitLocal = useRef(
    (queries, options = emptyObj) /*{type, queries}*/=> {
      // TODO: pass record state than the application state to optimistic and rollback
      //       when performing record updates. getting the state of the record will
      //       require knowing its key, which would be an api change
      queries = normalizeQueries(queries)
      queries.length > 0 && dispatchState(
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
    }
  )
  // routes the various query types to their proper committer
  const commit = useRef(
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
        commitLocal.current(optimisticQueries, options)
      }

      return processQueries.current(queries, options)
    }
  )
  // manages the subscriptions to queries in this endpoint
  const [queryState, dispatchQueryState] = useReducer(reducer, null, init)
  // adds subscriptions between this endpoint and queries
  const subscribe = useRef(
    id => {
      let numListeners = listeners.current.get(id)
      if (numListeners === void 0) {
        // adds this endpoint to the cache's listeners
        cache.current.subscribe(id, dispatchQueryState)
        // sets the query in state
        numListeners = 0
        dispatchQueryState({type: 'add', id, query: cache.current.get(id)})
        // used for calculating changed bits for context
        // keyObserver.current.setShard(id)
      }

      listeners.current.set(id, ++numListeners)
    }
  )
  // removes subscriptions between this endpoint and queries
  const unsubscribe = useRef(
    id => {
      let numListeners = listeners.current.get(id) - 1
      if (numListeners === 0) {
        cache.current.unsubscribe(id, dispatchQueryState)
        listeners.current.delete(id)
        dispatchQueryState({type: 'delete', id})
      }
      else
        listeners.current.set(id, numListeners)
    }
  )
  // creates the child context
  const childContext = useMemoOne(
    () => ({
      cache: cache.current,
      queries: queryState.value,
      subscribe: subscribe.current,
      unsubscribe: unsubscribe.current,
      commit: commit.current,
      commitLocal: commitLocal.current,
      commitFromCache: commitFromCache.current,
      // getBits: keyObserver.current.getBits,
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
        cache.current.unsubscribe(id, dispatchQueryState)
    },
    emptyArr
  )
  return <EndpointContext.Provider value={childContext} children={children}/>
  //return <EndpointInternalContext.Provider
  //  value={keyObserver.current.getBits}
  //  children={<EndpointContext.Provider value={childContext} children={children}/>}
  //>
}


if (__DEV__)
  Endpoint.propTypes = {
    cache: PropTypes.object,
    dispatchState: PropTypes.func.isRequired,
    network: PropTypes.shape({
      post: PropTypes.func.isRequired,
      abort: PropTypes.func.isRequired,
    }).isRequired
  }

export default Endpoint
