import React from 'react'
import PropTypes from 'prop-types'
import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
import {isNode} from '../utils'
import now from 'performance-now'
import {
  toRecords, 
  stateDidChange, 
  toImmutable, 
  collectStaleRecords, 
  createKeyObserver
} from './utils'
import StoreContext, {InternalContext} from './StoreContext'
import Endpoint from './Endpoint'
import createNetwork from '../createNetwork'

const defaultState = {data: emptyObj}
const formatHydrateQuery = query => ({
  nextState: [query.response.json],
  response: query.response,
  queries: [query.query],
  type: 'QUERY'
})

export default class Store extends React.Component {
  static defaultProps = {
    network: createNetwork(),
  }

  static propTypes = {
    network: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    // used for only updating connections that actually changed with unstable_observeBits
    // in react context
    this.keyObserver = createKeyObserver()
    // parses any initial state in props or the DOM
    if (props.cache !== void 0 && props.cache.size > 0) {
      this.state = isNode === true ? this.hydrateNode(props.cache) : defaultState
    }
    else {
      // didn't have an initial state
      this.state = defaultState
    }

    this.storeContext = {state: this.getState(), getBits: this.keyObserver.getBits}
  }

  async componentDidMount () {
    if (this.props.cache && this.props.cache.size > 0) {
      await this.hydrateBrowser()
    }
  }

  hydrateBrowser () {
    return Promise.all(
      this.props.cache.map(
        (id, query) => query.response && this.updateState(() => formatHydrateQuery(query))
      )
    )
  }

  hydrateNode (cache) {
    let state = defaultState

    cache.forEach(
      (id, query) =>
        query.response
        && (state = this.getNextState(state, formatHydrateQuery(query)) || state)
    )

    return state
  }

  componentWillUnmount () {
    this.keyObserver.clear()
  }

  getNextState = (state = emptyObj, updates)=> {
    let start

    if (__DEV__) {
      start = now()
    }

    let nextState = toRecords(Object.assign({state: state.data}, updates))
    // do a shallow comparison of the previous state to this one to avoid
    // unnecessary re-renders
    if (nextState === null || stateDidChange(state.data, nextState) === false) {
      if (__DEV__) {
        console.log('[Radar] state profiler:', now() - start)
      }

      return null
    }
    // used for calculating changed bits for context
    this.keyObserver.setBuckets(nextState)
    // removes stale records to avoid unexpected behaviors
    // when a record is removed from the state tree, it should be
    // assumed that this record is 'cleared', as well
    collectStaleRecords(nextState)
    // creates a new initial state for the query cache
    this.props.cache.initialState = nextState

    if (__DEV__) {
      console.log('[Radar] state profiler:', now() - start)
    }
    return {data: __DEV__ ? Object.freeze(nextState) : state.data}
  }

  updateState = updates/*(state) => ({nextState, queries, [<context> response, type]})*/ => {
    this.setState(state => this.getNextState(state, updates(state)))
  }

  getState = () => toImmutable(this.state.data)

  render () {
    if (__DEV__) console.log('[Radux] state:\n', this.state.data)
    const nextState = this.getState()

    if (this.storeContext.state !== nextState) {
      // enforces immutability preventing useless updates and ensuring
      // necessary ones
      this.storeContext = Object.assign({}, this.storeContext)
      this.storeContext.state = nextState
    }

    return (
      <InternalContext.Provider value={this.storeContext.getBits}>
        <StoreContext.Provider value={this.storeContext}>
          <Endpoint
            updateState={this.updateState}
            cache={this.props.cache}
            network={this.props.network}
            children={this.props.children}
          />
        </StoreContext.Provider>
      </InternalContext.Provider>
    )
  }
}
