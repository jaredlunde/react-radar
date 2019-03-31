import React from 'react'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import emptyObj from 'empty/object'
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
class Endpoint extends React.Component {
  static contextTypes = {
    // uses legacy for react-broker preloading compatibility
    waitForPromises: PropTypes.object
  }

  static propTypes = {
    store: PropTypes.shape({
      cache: PropTypes.object,
      updateState: PropTypes.func.isRequired,
    }).isRequired,
    network: PropTypes.shape({
      post: PropTypes.func.isRequired,
      abort: PropTypes.func.isRequired,
    }).isRequired
  }

  constructor (props, context) {
    super(props)
    this.cache = props.store.cache || createCache()
    this.keyObserver = createKeyObserver()
    this.state = {
      // internals
      queries: {},
      setCached: this.cache.set.bind(this.cache.set),
      getCached: this.cache.get.bind(this.cache.get),
      promises: context?.waitForPromises?.chunkPromises,
      subscribe: this.subscribe,
      unsubscribe: this.unsubscribe,
      getBits: this.keyObserver.getBits,
      // local 'optimistic' updates, does not send commit over the network
      commitLocal: this.commitLocal,
      // remote + optimistic updates - commits to the network
      commit: this.commit
    }
  }

  componentDidUpdate () {
    this.cache.collect()
  }

  componentWillUnmount () {
    this.props.network.abort()

    for (let id in this.listeners) {
      this.cache.unsubscribe(id, this)
    }
  }

  listeners = {}

  subscribe = (id, component) => {
    if (this.listeners[id] === void 0) {
      // adds this endpoint to the cache's listeners
      this.cache.subscribe(id, this)
      // sets the query in state
      this.listeners[id] = new Set()
      this.setState(
        ({queries}) => queries[id] === void 0
          ? ({queries: {...queries, [id]: this.cache.get(id)}})
          : null
      )
      // used for calculating changed bits for context
      this.keyObserver.setBucket(id)
    }

    this.listeners[id].add(component)
  }

  unsubscribe = (id, component) => {
    const listeners = this.listeners[id]

    if (listeners !== void 0) {
      listeners.delete(component)

      if (listeners.size === 0) {
        this.cache.unsubscribe(id, this)
        delete this.listeners[id]

        this.setState(
          ({queries}) => {
            let nextQueries = {},
              keys = Object.keys(queries),
              i = 0,
              qid

            for (; i < keys.length; i++) {
              qid = keys[i]
              if (qid === id) continue
              nextQueries[qid] = queries[qid]
            }

            return {queries: nextQueries}
          }
        )
      }
    }
  }

  notify = (id, query) => this.setState(
    // this must be immutable for getBits
    ({queries}) => ({queries: {...queries, [id]: {...query}}})
  )

  commit = async (opt, context) => {
    if (isNode === false) {
      const optimisticQueries = []

      for (let i = 0; i < opt.queries.length; i++) {
        const query = opt.queries[i]

        if (typeof query.optimistic === 'function' || query.local !== false) {
          optimisticQueries.push(query)
        }
      }

      // commits an optimistic updates first but not on the server
      this.commitLocal({...opt, queries: optimisticQueries})
    }
    // creates query payloads for the network
    let {type = 'update', queries} = opt
    const payload = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]

      if (query.local !== true) {
        // attaches payload object for network queries
        const requires = {}

        for (let key in query.requires) {
          requires[key] = query.requires[key].requiresFields
        }

        payload.push({name: query.name, props: query.params, requires})
      }
    }

    if (payload.length > 0) {
      // commits the payloads to the network
      const commit = this.commitPayload(payload, context)
      // sets the commit promise in the cache
      for (let i = 0; i < queries.length; i++) {
        this.cache.setCommit(getQueryID(queries[i]), commit)
      }
      // resolves the commit promise
      let {response, nextState} = await commit
      // We only want to perform state updates with setState in the browser.
      // On the server side we use the query cache and multiple iterations to populate the
      // data in the tree.
      isNode === false && this.props.store.updateState(
        state => {
          // function which executes rollbacks on queries that need them
          const doRollback = rollbacks => {
            for (let i = 0; i < rollbacks.length; i++) {
              const query = rollbacks[i]
              if (query === void 0) continue
              if (typeof query.rollback === 'function') {
                // optimistic updates can rollback on errors
                queries.unshift(query)
                nextState.unshift(query.rollback(query.input, state, query))
              }
            }
          }

          switch (response.status) {
            case   0:
            case 200:
              doRollback(queries.map(
                (query, i) => response.json && response.json[i].isRadarError ? query : void 0
              ))
              break;
            default:
              // executes rollbacks on the failed mutations
              doRollback(queries)
          }

          return {nextState, queries, response, type}
        }
      )
      // if the response was not a 200 response it is considered an error status
      const status = response.ok === true ? DONE : ERROR
      // updates the cache for each query
      for (let i = 0; i < queries.length; i++) {
        this.cache.set(
          getQueryID(queries[i]),
          {status, response: {...response, json: response.json && response.json[i]}}
        )
      }

      return response
    }
  }

  async commitPayload (payload, context) {
    // posts the JSON request
    const response = await this.props.network.post(payload, context)
    return {response, nextState: response.json}
  }

  commitLocal = opt /*{type, queries}*/=> {
    // TODO: pass record state than the application state to optimistic and rollback
    //       when performing record updates. getting the state of the record will
    //       require knowing its key, which would be an api change
    if (opt.queries.length > 0) {
      this.props.store.updateState(
        state => {
          const updates = []

          for (let i = 0; i < opt.queries.length; i++) {
            const query = opt.queries[i]

            if (typeof query.optimistic === 'function') {
              updates.push(query.optimistic(query.input, state, query))
            }
            else {
              updates.push(emptyObj)
            }
          }

          return {
            nextState: updates,
            queries: opt.queries,
            type: `OPTIMISTIC_${(opt.type || 'update').toUpperCase()}`
          }
        }
      )
    }
  }

  render () {
    return (
      <EndpointInternalContext.Provider value={this.state.getBits}>
        <EndpointContext.Provider value={this.state} children={this.props.children}/>
      </EndpointInternalContext.Provider>
    )
  }
}

export default ({children, network, ...props}) => network(
  context => <Endpoint network={context} store={props} children={children}/>
)

