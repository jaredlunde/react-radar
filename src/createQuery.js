import emptyObj from 'empty/object'
import {invariant} from './utils'


const REDUCER_NAMES = new Set()
export function createReducer (name, reducer) {
  if (__DEV__) {
    invariant(
      REDUCER_NAMES.has(name) === false,
      'Query reducers must have unique names in order to prevent errors in ' +
      `SSR hydration. '${name}' has already been used in this application.`
    )

    Object.defineProperty(reducer, 'name', {value: name})
  }

  REDUCER_NAMES.add(name)
  reducer.id = name
  return reducer
}

const defaultReducer = createReducer(
  'defaultReducer',
  function (prevState, nextState, context) {
    // console.log('Reducer:', prevState, nextState, context)
    nextState = Object.assign({}, prevState, nextState)

    for (let key in nextState) {
      if (nextState[key] === void 0 && nextState.hasOwnProperty(key)) {
        delete nextState[key]
      }
    }

    return nextState
  }
)

export const noop = createReducer(
  'noop',
  function (prevState) {
    return prevState
  }
)

export default function createQuery ({
  name,
  contains,
  defaultProps,
  getOptimistic,
  getRollback,
  reducer = defaultReducer
}) {
  if (__DEV__) {
    invariant(name, `Queries must be created with a 'name' property.`)
  }

  function Query (props = emptyObj, contains_, reducer_) {
    if (typeof props === 'function') {
      contains_ = props
      props = emptyObj
    }
    else {
      props = props = Object.assign({}, defaultProps, props)
    }
    const queryContains = (contains_ || contains)(props)

    return {
      name,
      props,
      contains: queryContains,
      optimistic: getOptimistic && getOptimistic(props, queryContains),
      rollback: getRollback && getRollback(props, queryContains),
      reducer: reducer || reducer_
    }
  }

  if (__DEV__) {
    Object.defineProperty(Query, 'name', {value: name})
  }

  return Query
}
