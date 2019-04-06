import React from 'react'
import PropTypes from 'prop-types'
import emptyObj from 'empty/object'
import {isNode} from '../utils'
import {
  toRecords, 
  stateDidChange, 
  toImmutable, 
  collectStaleRecords, 
  createKeyObserver
} from './utils'
import {StoreContext, StoreInternalContext} from './StoreContext'
import Endpoint from './Endpoint'
import createNetwork from '../createNetwork'

let now
if (__DEV__) {
  now = require('performance-now')
}


const defaultState = {_data: emptyObj, data: emptyObj}
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

    this.state.getBits = this.keyObserver.getBits
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

  getNextState = (state = emptyObj, updates)=> {
    let start

    if (__DEV__) {
      start = now()
    }

    let nextState = toRecords(Object.assign({state: state._data}, updates))
    // do a shallow comparison of the previous state to this one to avoid
    // unnecessary re-renders
    if (nextState === null || stateDidChange(state._data, nextState) === false) {
      if (__DEV__) {
        console.log('[Radar] state profiler:', now() - start)
      }

      return null
    }
    // used for calculating changed bits in React context
    this.keyObserver.setBuckets(nextState)
    // removes stale records to avoid unexpected behaviors
    // when a record is removed from the state tree, it should be
    // assumed that this record is 'cleared', as well
    collectStaleRecords(nextState)

    if (__DEV__) {
      console.log('[Radar] state profiler:', now() - start)
    }

    return {
      _data: __DEV__ ? Object.freeze(nextState) : nextState,
      data: toImmutable(nextState)
    }
  }

  updateState = updates/*state => ({nextState, queries, [<context> response, type]})*/ => {
    this.setState(state => this.getNextState(state, updates(state.data)))
  }

  render () {
    if (__DEV__) console.log('[Radar] state:\n', this.state._data)
    
    return (
      <StoreInternalContext.Provider value={this.state.getBits}>
        <StoreContext.Provider value={this.state}>
          <Endpoint
            updateState={this.updateState}
            cache={this.props.cache}
            network={this.props.network}
            children={this.props.children}
          />
        </StoreContext.Provider>
      </StoreInternalContext.Provider>
    )
  }
}
