import React from 'react'
import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
// import now from 'performance-now'
import toRecords from './utils/toRecords'
import {stateDidChange, toImmutable} from './utils'
import Connections from './Connections'
import StoreContext from './StoreContext'
import InternalContext from './InternalContext'
import Endpoint from './Endpoint'
import createNetwork from '../createNetwork'


export default class Store extends React.Component {
  static defaultProps = {network: createNetwork()}

  constructor (props) {
    super(props)
    // parses any initial state in props or the DOM
    let initialState

    if (props.cache !== void 0) {
      initialState = props.cache.initialState
      // if the initial state was from the DOM, defer its rendering until
      // the endpoint is ready
      this.state = {data: initialState || emptyObj}
    }
    else {
      // didn't have an initial state
      this.state = {data: emptyObj}
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

  // componentDidMount () {
  //   // hacky way to fix some goings on with InternalContext I don't understand
  //   this.internalContext = Object.assign({}, this.internalContext)
  // }

  componentWillUnmount () {
    for (let commit of this.commits) {
      commit.cancel()
    }

    Connections.clear()
  }

  updateState = updates/*{nextState, queries, [<context> response, type]}*/ => {
    // handles actions and query updates
    const willSet = new Promise(
      resolve => this.setState(
        // sets the next state of the store
        state => {
          // const start = now()
          let nextState = toRecords(Object.assign({state: state.data}, updates))
          // do a shallow comparison of the previous state to this one to avoid
          // unnecessary re-renders
          if (nextState === null || stateDidChange(state.data, nextState) === false) {
            // console.log(`[nextState profiler] ${now() - start}ms`)
            resolve(state.data)
            return null
          }
          // sets the local state
          Connections.setBuckets(nextState)
          // console.log(`[nextState profiler] ${now() - start}ms`)
          resolve(nextState)
          return {data: nextState}
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
