import React from 'react'
import Immutable from 'seamless-immutable'
import Promise from 'cancelable-promise'
import debounce from '@render-props/debounce/es/utils/debounce'
import emptyObj from 'empty/object'
import {
  withRecords,
  getRecordKeys,
  stateDidChange,
  deepInvalidate,
  toImmutable
} from './utils'
import {parseState} from '../createFetcher'
import Records from './Records'
import RegisteredRecords, {RegisteredRecords as RRMap} from './RegisteredRecords'
import StoreConnections from './StoreConnections'
import StoreContext from './StoreContext'
import InternalContext from './InternalContext'


/**
 * The Store component handles the the state for Endpoints and transforms
 * data received by the Networking layer into Records.
 * @extends React.Component
 */
export default class StoreProvider extends React.Component {
  constructor (props) {
    super(props)
    // parses any initial state in props or the DOM
    const initialState = props.initialState || parseState()

    if (initialState) {
      // if the initial state was from the DOM, defer its rendering until
      // the endpoint is ready
      if (initialState.isDOM === true) {
        this.state = {data: emptyObj}
      }
      else {
        // if the initial state is from props, go ahead and process it because
        // we have the reducer, queries, etc and don't need an endpoint
        this.state = this.getNextState(initialState)({data: emptyObj}, emptyObj)
      }
    }
    else {
      // didn't have an initial state
      this.state = {data: emptyObj}
    }

    this.commits = []
    this.endpoints = []
    // context for the endpoint and store consumers
    this.providerContext = {
      initialState,
      getBits: this.getBits,
      setStore: this.setStore,
      setRecords: this.setRecords,
      registerEndpoint: this.registerEndpoint,
      unregisterEndpoint: this.unregisterEndpoint
    }
    // StoreConsumer context
    this.storeContext = {
      data: this.getState(),
      getChangedBits: this.getBits
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.data !== this.state.data) {
      // prevents the store from listening to changes on records for which it
      // no longer possesses in its state
      RegisteredRecords.diffUnregister(this, prevState.data, this.state.data).then(
        // garbage collects stale records
        RegisteredRecords.collect
      )
    }
  }

  componentWillUnmount () {
    while (this.commits.length > 0) {
      this.commits.pop().cancel()
    }

    StoreConnections.dispose(this)
    RegisteredRecords.disposeStore(this)
  }

  registerEndpoint = endpoint => {
    // parses/generates initial data tied to this endpoint
    this.endpoints.push(endpoint)
    const initialState = this.providerContext.initialState

    if (initialState !== null) {
      if (initialState.isDOM === true) {
        if (endpoint.props.name === initialState.endpoint) {
          initialState.queries = endpoint.props.queries
          initialState.reducer = endpoint.props.reducer
          this.setState(this.getNextState(initialState)(this.state, emptyObj))
        }
      }

      this.providerContext.initialState = null
    }
  }

  unregisterEndpoint = endpoint => this.endpoints.splice(this.endpoints.indexOf(endpoint), 1)

  invalidate = debounce(
    callback => {
      // Creates a new immutable object from the state
      this.setState(
         prevState => {
          const nextState = deepInvalidate(prevState.data)
          StoreConnections.setBuckets(this, nextState)
          return {data: nextState}
        },
        callback
      )
    },
    75
  )

  getNextState =
    ({reducer, nextState, queries, queryProps, ...context}) =>
    (prevState, props) => {
      // transforms the state to Record objects
      nextState = withRecords({
        store: this,
        nextState,
        queries,
        queryProps
      })
      // executes the user-defined reducer
      nextState = reducer(
        prevState.data,
        nextState,
        {queries, queryProps, ...context}
      )
      // lets people evacuate/undo w/ null
      if (nextState === null) {
        const recordKeys = getRecordKeys(nextState)

        for (let x = 0; x < recordKeys.length; x++) {
          RegisteredRecords.unregister(this, recordKeys[x])
        }
        return null
      }
      // do a shallow comparison of the previous state to this one
      // at the moment, this seems more performant than unnecessary
      // re-renders. but testing will need to be done on this.
      // if it isn't, I will just remove it.
      if (
        prevState.data !== emptyObj
        && stateDidChange(prevState.data, nextState) === false
      ) {
        return null
      }
      // sets the local state
      StoreConnections.setBuckets(this, nextState)
      return {data: nextState}
    }

  setStore = (props/*{reducer, nextState, queries, queryProps, ...context}*/) => {
    // handles actions and query updates
    const willSet = new Promise(
      (resolve, reject) => {
        this.setState(
          // sets the next state of the store
          this.getNextState(props),
          // removes the commit because it can't be canceled anymore
          () => {
            // resolves the setStore promise
            resolve(this.state.data)
            // removes the commit because it can't be canceled anymore
            this.commits.splice(this.commits.indexOf(willSet), 1)
          }
        )
      }
    )

    this.commits.push(willSet)
    return willSet
  }

  setRecords = ({nextState, queries, queryProps, ...context}) => {
    // handles record mutations
    const willSet = new Promise(
      (resolve, reject) => {
        const start = performance.now()
        // gets and sets the records with their new states
        withRecords({
          store: this,
          nextState,
          queries,
          queryProps,
          ...context
        })
        // invalidates this store so consumers get a fresh update w/ the
        // record changes
        this.invalidate(
          () => {
            // resolves the setStore promise
            resolve(this.state.data)
            // removes the commit because it can't be canceled anymore
            this.commits.splice(this.commits.indexOf(willSet), 1)
          }
        )
      }
    )

    this.commits.push(willSet)
    return willSet
  }

  getState = () => toImmutable(this.state.data)
  getBits = keys =>  StoreConnections.getBits(this, keys)

  render () {
    if (__DEV__) console.log('[Radux] state:\n', this.state.data);
    const nextState = this.getState()

    if (this.storeContext.data !== nextState) {
      // enforces immutability preventing useless updates and ensuring
      // necessary ones
      this.storeContext = Object.assign({}, this.storeContext)
      this.storeContext.data = nextState
    }

    return (
      <InternalContext.Provider value={this.providerContext}>
        <StoreContext.Provider value={this.storeContext}>
          {this.props.children}
        </StoreContext.Provider>
      </InternalContext.Provider>
    )
  }
}
