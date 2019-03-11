import React from 'react'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import {invariant, isNode} from '../../utils'
import {createKeyObserver} from '../utils'
import {EndpointContext, EndpointInternalContext} from './EndpointContext'
import createCache from './createCache'


export const getQueryID = memoize([WeakMap], query => {
  const fn = `${query.name}(${JSON.stringify(query.props)}) =>`
  let requires = {}

  for (let key in query.requires) {
    requires[key] = query.requires[key].requiresFields
  }

  if (__DEV__) {
    invariant(
      query.reducer.id,
      `Query reducers need to define a unique 'id' property to avoid errors ` +
      `in hydrating SSR applications. e.g. yourReducer.id = 'yourReducer'. ` +
      `It is recommended, however, that you use the 'createReducer' function ` +
      `to ensure backwards compatibility.`
    )
  }

  requires = `${query.reducer.id}(${JSON.stringify(requires)})`
  return `${fn} ${requires}`
})

export const WAITING = 0
export const ERROR = 1
export const LOADING = 2
export const DONE = 3

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

  componentWillUnmount () {
    this.props.network.abort()

    for (let id in this.listeners) {
      this.cache.unsubscribe(id, this)
    }
  }

  listeners = {}

  subscribe = (id, component) => {
    if (this.listeners[id] === void 0) {
      this.listeners[id] = new Set()
      this.cache.subscribe(id, this)
      // used for calculating changed bits for context
      this.keyObserver.setBuckets(this.listeners)
    }

    this.listeners[id].add(component)
  }

  unsubscribe = (id, component) => {
    const listeners = this.listeners[id]
    const el = listeners && listeners.has(component)

    if (el === true) {
      listeners.delete(el)
      // TODO: Figure out a way to unsubscribe the endpoint from the query when
      //       there are FOR SURE no child listeners
    }
  }

  notify = (id, query) => this.setState(
    // this must be immutable for getBits
    ({queries}) => ({queries: {...queries, [id]: {...query}}})
  )

  commit = async (opt, context) => {
    if (isNode === false) {
      this.commitLocal(opt)
    }

    let {type, queries} = opt
    const payload = []

    for (let query of queries) {
      const requires = {}

      for (let key in query.requires) {
        requires[key] = query.requires[key].requiresFields
      }

      payload.push({name: query.name, props: query.props, requires})
    }

    const commit = await this.commitPayload(payload, context)

    for (let query of queries) {
      this.cache.setCommit(getQueryID(query), commit)
    }

    let {response, nextState} = await commit
    // We only want to perform state updates with setState in the browser.
    // On the server side we use the query cache and multiple iterations to populate the
    // data in the tree.
    isNode === false && this.props.store.updateState(
      state => {
        switch (response.status) {
          case   0:
          case 200:
            break;
          default:
            // execute rollbacks on the failed mutations
            const rollbackQueries = [], rollbacks = []

            for (let query of queries) {
              if (typeof query.rollback === 'function') {
                // optimistic updates can rollback on errors
                rollbackQueries.push(query)
                rollbacks.push(query.rollback(query.props, state, query.requires))
              }
            }

            if (rollbacks.length > 0) {
              nextState = rollbacks
              queries = rollbackQueries
              type = `ROLLBACK_${type.toUpperCase()}`
            }
        }

        return {nextState, queries, response, type}
      }
    )

    const status = response.ok === true ? DONE : ERROR

    for (let i = 0; i < queries.length; i++) {
      this.cache.set(
        getQueryID(queries[i]),
        {status, response: {...response, json: response.json && response.json[i]}}
      )
    }

    return response
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
    const optimisticQueries = []

    for (let query of opt.queries) {
      if (typeof query.optimistic === 'function') {
        optimisticQueries.push(query)
      }
    }

    if (optimisticQueries.length > 0) {
      this.props.store.updateState(
        state => {
          const optimisticUpdates = []

          for (let query of optimisticQueries) {
            optimisticUpdates.push(
              query.optimistic(query.props, state, query.requires)
            )
          }

          return {
            nextState: optimisticUpdates,
            queries: optimisticQueries,
            type: `OPTIMISTIC_${opt.type.toUpperCase()}`
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

export default ({children, ...props}) => props.network(context => <Endpoint
  network={context}
  store={props}
  children={children}
/>)

