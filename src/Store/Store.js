import React, {useRef, useReducer, useCallback} from 'react'
import PropTypes from 'prop-types'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {isNode} from '../utils'
import createNetwork from '../createNetwork'
import {
  toRecords,
  stateDidChange,
  toImmutable,
  // collectStaleRecords,
  createKeyObserver
} from './utils'
import {StoreContext, StoreInternalContext} from './StoreContext'
import Endpoint from './Endpoint'

let now
if (__DEV__) now = require('performance-now')

const defaultState = {_data: emptyObj, data: emptyObj}
const formatHydrateQuery = query => ({
  nextState: [query.response.json],
  response: query.response,
  queries: [query.query],
  type: 'QUERY'
})

const Store = ({network = createNetwork(), cache, children}) => {
  const keyObserver = useRef(null)
  if (keyObserver.current === null) keyObserver.current = createKeyObserver()

  const getNextState = useCallback(
    (state = emptyObj, updates) => {
      let start
      if (__DEV__) start = now()
      let nextState = toRecords(Object.assign({state: state._data}, updates))
      // do a shallow comparison of the previous state to this one to avoid
      // unnecessary re-renders
      if (nextState === null || stateDidChange(state._data, nextState) === false) {
        if (__DEV__) console.log('[Radar] state profiler:', now() - start)
        return null
      }
      // used for calculating changed bits in React context
      keyObserver.current.setBuckets(nextState)
      // TODO: Maybe reinstate this?
      // removes stale records to avoid unexpected behaviors
      // when a record is removed from the state tree, it should be
      // assumed that this record is 'cleared', as well
      // collectStaleRecords(nextState)
      if (__DEV__) {
        console.log('[Radar] records', require('./utils/Records').default)
        console.log('[Radar] state profiler:', now() - start)
      }

      return {
        _data: __DEV__ ? Object.freeze(nextState) : nextState,
        data: toImmutable(nextState)
      }
    },
    emptyArr
  )

  const init = useCallback(
    cache => {
      let state = defaultState
      if (cache?.size && isNode === true) {
        cache.forEach(
          query =>
            query.response && (state = getNextState(state, formatHydrateQuery(query)) || state)
        )
      }
      // provides context for calculating changed bits
      state.getBits = keyObserver.current.getBits
      return state
    },
    emptyArr
  )

  const
    reducer = useCallback(
      (state, updates) =>
        Object.assign({}, state, getNextState(state, updates(state.data))),
      emptyArr
    ),
    [state, dispatch] = useReducer(reducer, cache, init),
    updateState = useCallback(updates => dispatch(updates), emptyArr)

  if (__DEV__) console.log('[Radar] state:\n', state._data)
  return (
    <StoreInternalContext.Provider value={keyObserver.current.getBits}>
      <StoreContext.Provider value={state}>
        <Endpoint updateState={updateState} cache={cache} network={network} children={children}/>
      </StoreContext.Provider>
    </StoreInternalContext.Provider>
  )
}

if (__DEV__)
  Store.propTypes = {
    network: PropTypes.func.isRequired
  }

export default Store