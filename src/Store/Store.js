import React from 'react'
import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
import {isNode} from '../utils'
import now from 'performance-now'
import {toRecords, stateDidChange, toImmutable} from './utils'
import Connections from './Connections'
import StoreContext from './StoreContext'
import InternalContext from './InternalContext'
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
  static defaultProps = {network: createNetwork()}

  constructor (props) {
    super(props)
    // parses any initial state in props or the DOM
    let initialState

    if (props.cache !== void 0 && props.cache.size > 0) {
      initialState = props.cache.initialState
      this.state = isNode === true ? this.hydrateNode(props.cache) : defaultState
    }
    else {
      // didn't have an initial state
      this.state = defaultState
    }

    this.commits = []
    // context for the endpoint and store consumers
    this.internalContext = {
      initialState,
      getBits: this.getBits,
      updateState: this.updateState
    }
    this.storeContext = {
      state: this.getState(),
      getBits: this.getBits
    }
  }

  async componentDidMount () {
    if (this.props.cache && this.props.cache.size > 0) {
      await this.hydrateBrowser()
    }
  }

  hydrateBrowser () {
    return Promise.all(
      this.props.cache.map(
        (id, query) => query.response && this.updateState(
          formatHydrateQuery(query)
        )
      )
    )
  }

  hydrateNode (cache) {
    let state = {data: {}}

    cache.forEach(
      (id, query) =>
        query.response
        && (state = this.getNextState(state, formatHydrateQuery(query)) || state)
    )

    return state
  }

  componentWillUnmount () {
    for (let commit of this.commits) {
      commit.cancel()
    }

    Connections.clear()
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
    // sets the local state
    Connections.setBuckets(nextState)

    if (__DEV__) {
      console.log('[Radar] state profiler:', now() - start)
    }

    return {data: nextState}
  }

  updateState = updates/*{nextState, queries, [<context> response, type]}*/ => {
    // handles actions and query updates
    let willSet
    // this has to be done this way (with let) or there is a 'willSet is not
    // defined' error that crops up
    willSet = new Promise(
      resolve => this.setState(
        // sets the next state of the store
        state => {
          const nextState = this.getNextState(state, updates) || state
          resolve(nextState)
          return nextState
        },
        // removes the commit because it can't be canceled anymore
        () => {
          // removes the commit because it can't be canceled anymore
          this.commits.splice(this.commits.indexOf(willSet), 1)
        }
      )
    )

    this.commits.push(willSet)
    return willSet
  }

  getState = () => toImmutable(this.state.data)
  getBits = keys =>  Connections.getBits(keys)

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
      <InternalContext.Provider value={this.internalContext}>
        <StoreContext.Provider value={this.storeContext}>
          <Endpoint
            {...this.internalContext}
            cache={this.props.cache}
            network={this.props.network}
            children={this.props.children}
          />
        </StoreContext.Provider>
      </InternalContext.Provider>
    )
  }
}
