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

export const defaultReducer = createReducer(
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
  requires,
  defaultProps,
  getOptimistic,
  getRollback,
  reducer = defaultReducer
}) {
  if (__DEV__) {
    invariant(name, `Queries must be created with a 'name' property.`)
  }

  function Query (props = emptyObj, requires_, reducer_) {
    if (typeof props === 'function') {
      requires_ = props
      props = emptyObj
    }
    else {
      props = props = Object.assign({}, defaultProps, props)
    }
    const queryRequires = (requires_ || requires)(props)

    return {
      // network props
      name,
      props,
      requires: queryRequires,
      // local props
      optimistic: getOptimistic && getOptimistic(props, queryRequires),
      rollback: getRollback && getRollback(props, queryRequires),
      reducer: reducer || reducer_
    }
  }

  Object.defineProperty(Query, 'name', {value: name})
  return Query
}
