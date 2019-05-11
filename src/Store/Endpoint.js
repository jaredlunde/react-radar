import React, {useMemo, useRef, useEffect, useCallback} from 'react'
import useForceUpdate from 'use-force-update'
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
export const getQueryID = memoize([WeakMap], query => {
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

/**
 * The Endpoint component is the glue that binds together the Networking layer,
 * Props, the Store and Context.
 * @extends React.Component
 */
const Endpoint = ({store, network, children}) => {
  const
    cache = useRef(store.cache),
    keyObserver = useRef(null),
    listeners = useRef(null),
    queries = useRef(emptyObj),
    forceUpdate = useForceUpdate()
  // populates current values for listeners, keyObserver, and cache
  if (listeners.current === null) {
    listeners.current = {}
    keyObserver.current = createKeyObserver()
    cache.current = cache.current || createCache()
  }
  // garbage collects the cache each update
  useEffect(() => cache.current.collect(), [queries.current])
  // This notification callback is passed to the cache. It's fired each time the cache
  // updates.
  const notify = useCallback(
    (id, query) => {
      queries.current = Object.assign({}, queries.current)
      queries.current[id] = Object.assign({}, query)
      forceUpdate()
    },
    emptyArr
  )
  // aborts network requests on unmount
  useEffect(() => () => network.abort(), [network.abort])
  // unsubscribes notifiers on unmount or when notify callback changes
  useEffect(
    () => {
      for (let id in listeners.current)
        cache.current.subscribe(id, notify)

      return () => {
        for (let id in listeners.current)
          cache.current.unsubscribe(id, notify)
      }
    },
    [notify]
  )
  // manages subscriptions from queries/updates
  const subscribe = useCallback(
    (id, component) => {
      if (listeners.current[id] === void 0) {
        // adds this endpoint to the cache's listeners
        cache.current.subscribe(id, notify)
        // sets the query in state
        listeners.current[id] = new Set()
        queries.current = Object.assign({}, queries.current)
        queries.current[id] = cache.current.get(id)
        // used for calculating changed bits for context
        keyObserver.current.setBucket(id)
      }

      listeners.current[id].add(component)
    },
    emptyArr
  )
  // manages unmounts of queries/updates
  const unsubscribe = useCallback(
    (id, component) => {
      const idListeners = listeners.current[id]

      if (idListeners !== void 0) {
        idListeners.delete(component)

        if (idListeners.size === 0) {
          cache.current.unsubscribe(id, notify)
          listeners.current[id] = void 0
          let
            nextQueries = {},
            keys = Object.keys(queries.current),
            i = 0,
            qid

          for (; i < keys.length; i++) {
            qid = keys[i]
            if (qid === id) continue
            nextQueries[qid] = queries.current[qid]
          }

          queries.current = nextQueries
        }
      }
    },
    emptyArr
  )
  // commits a query payload to the network
  const commitPayload = useCallback(
    async (payload, context = emptyObj) => {
      // posts the JSON request
      const response = await network.post(payload, context)
      return {response, nextState: response.json}
    },
    [network.post]
  )
  // commits local updates to the store
  const commitLocal = useCallback(
    opt /*{type, queries}*/=> {
      // TODO: pass record state than the application state to optimistic and rollback
      //       when performing record updates. getting the state of the record will
      //       require knowing its key, which would be an api change
      opt.queries.length > 0 && store.updateState(
        state => {
          let updates = [], i = 0

          for (; i < opt.queries.length; i++) {
            const query = opt.queries[i]
            if (typeof query.optimistic === 'function')
              updates.push(query.optimistic(query.input, state, query))
            else
              updates.push(emptyObj)
          }

          return {
            nextState: updates,
            queries: opt.queries,
            type: `OPTIMISTIC_${(opt.type || 'update').toUpperCase()}`
          }
        }
      )
    },
    emptyArr
  )
  // processes incoming queries
  const processQueries = useCallback(
    async (type, queries, context) => {
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
        const commit = commitPayload(payload, context)
        // sets the commit promise in the cache
        for (i = 0; i < queries.length; i++)
          cache.current.setCommit(getQueryID(queries[i]), commit)
        // resolves the commit promise
        let {response, nextState} = await commit
        // We only want to perform state updates with setState in the browser.
        // On the server side we use the query cache and multiple iterations to populate the
        // data in the tree.
        if (isNode === false) {
          store.updateState(state => {
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

            return {nextState, queries, response, type}
          })
        }
        // if the response was not a 200 response it is considered an error status
        const status = response.ok === true ? DONE : ERROR
        // updates the cache for each query
        for (i = 0; i < queries.length; i++)
          cache.current.set(
            getQueryID(queries[i]),
            {status, response: {...response, json: response.json && response.json[i]}}
          )

        return response
      }
    },
    [commitPayload]
  )
  // commits queries from the query cache to the store
  const commitFromCache = useCallback(
    opt => {
      opt.queries.length > 0 && store.updateState(state => {
        const updates = [], updateQueries = []

        for (let i = 0; i < opt.queries.length; i++) {
          const query = opt.queries[i], cached = cache.current.get(getQueryID(query))

          if (cached?.response?.json) {
            updateQueries.push(query)
            updates.push(cached.response.json)
          }
        }

        return {
          nextState: updates,
          queries: updateQueries,
          type: (opt.type || 'update').toUpperCase()
        }
      })
    },
    emptyArr
  )
  // routes the various query types to their proper committer
  const commit = useCallback(
    async (opt, context = emptyObj) => {
      if (isNode === false) {
        let optimisticQueries = [],  i = 0
        for (; i < opt.queries.length; i++) {
          const query = opt.queries[i]
          if (typeof query.optimistic === 'function' || query.local !== false)
            optimisticQueries.push(query)
        }
        // commits an optimistic updates first but not on the server
        commitLocal({...opt, queries: optimisticQueries})
      }
      // creates query payloads for the network
      let {type = 'update', queries} = opt
      // commits the payloads to the network
      if (context.async === true) {
        let promises = [], i = 0
        for (; i < queries.length; i++)
          promises.push(processQueries(type, queries.slice(i, i + 1), context))
        return Promise.all(promises)
      }

      return processQueries(type, queries, context)
    },
    [processQueries, commitLocal]
  )
  // creates a child context for queries to consume
  const childContext = useMemo(
    () => ({
      // internals
      setCached: cache.current.set.bind(cache.current.set),
      getCached: cache.current.get.bind(cache.current.get),
      subscribe,
      unsubscribe,
      getBits: keyObserver.current.getBits,
      commitLocal,
      commit,
      commitFromCache,
      queries: queries.current
    }),
    [subscribe, unsubscribe, commitLocal, commit, commitFromCache, queries.current]
  )

  return <EndpointInternalContext.Provider
    value={keyObserver.current.getBits}
    children={<EndpointContext.Provider value={childContext} children={children}/>}
  />
}

if (__DEV__)
  Endpoint.propTypes = {
    store: PropTypes.shape({
      cache: PropTypes.object,
      updateState: PropTypes.func.isRequired,
    }).isRequired,
    network: PropTypes.shape({
      post: PropTypes.func.isRequired,
      abort: PropTypes.func.isRequired,
    }).isRequired
  }

export default ({children, network, ...props}) => network(
  context => <Endpoint network={context} store={props} children={children}/>
)

