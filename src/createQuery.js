import emptyObj from 'empty/object'
import {invariant, objectWithoutProps} from './utils'


export const createReducer = (name, reducer) => {
  reducer.id = name
  return reducer
}

export const defaultReducer = createReducer(
  'defaultReducer',
  (prevState, nextState, context) => {
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

const defaultParams = p => p
export const noop = createReducer('noop', defaultParams)
const noRequires = () => {}

export default ({
  name,
  requires,
  params = defaultParams,
  optimistic,
  rollback,
  local = false,
  reducer = defaultReducer
}) => {
  if (__DEV__) {
    invariant(name, `Queries must be created with a 'name' property.`)
  }

  function Query (input = emptyObj, requires_, reducer_) {
    if (typeof input === 'function') {
      reducer_ = requires_
      requires_ = input
      input = null
    }

    return {
      name,
      input,
      params: params(input),
      requires: (requires_ || requires || noRequires)(input),

      optimistic,
      rollback,
      reducer: reducer_ || reducer,

      local,
      isRecordUpdate: Query.isRecordUpdate || false
    }
  }

  Query.id = name
  return Query
}
