import emptyObj from 'empty/object'
import {invariant, objectWithoutProps} from './utils'


const REDUCER_NAMES = new Set()
export function createReducer (name, reducer) {
  if (__DEV__) {
    invariant(
      REDUCER_NAMES.has(name) === false,
      'Query reducers must have unique names in order to prevent errors in ' +
      `SSR hydration. '${name}' has already been used in this application.`
    )
  }

  REDUCER_NAMES.add(name)
  reducer.id = name
  return reducer
}

export const defaultReducer = createReducer(
  'defaultReducer',
  function (prevState, nextState, context) {
    // console.log('Reducer:', prevState, nextState, context)
    let remove = [],
        realNextState = {},
        nextKeys = Object.keys(nextState),
        prevKeys = Object.keys(prevState),
        i = 0

    for (; i < nextKeys.length; i++) {
      const key = nextKeys[i]

      if (nextState[key] === void 0 && nextState.hasOwnProperty(key)) {
        remove.push(nextState[key])
      }
      else {
        realNextState[key] = nextState[key]
      }
    }

    for (i = 0; i < prevKeys.length; i++) {
      const key = prevKeys[i]

      if (realNextState[key] === void 0) {
        realNextState[key] = prevState[key]
      }
    }

    return remove.length > 0
      ? objectWithoutProps(realNextState, remove)
      : realNextState
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
      reducer_ = requires_
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
      reducer: reducer_ || reducer
    }
  }

  Query.id = name
  return Query
}
