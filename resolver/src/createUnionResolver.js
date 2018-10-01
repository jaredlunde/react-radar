import invariant from 'invariant'
import {defaultRecordReducer} from './createRecordResolver'
import {equalKeys} from './utils'


function defaultGetRecordName (state, props, context) {
  state = Array.isArray(state) ? state[0] : state
  return Object.keys(state)[0]
}

export default function createUnionResolver ({
  union,
  resolves,
  reducer = defaultRecordReducer,
  getRecordName = defaultGetRecordName
}) {
  if (__DEV__) {
    invariant(
      union !== void 0,
      `Union resolvers require a 'union' property be defined.`
    )

    invariant(
      resolves !== void 0 && resolves.length !== 0,
      `Union resolvers require a 'resolves' property be defined.`
    )

    if (equalKeys(resolves, union.fields) === false) {
      const resolvesKeys = Object.keys(resolves)
      const unionKeys = Object.keys(union.fields)
      const resDiff = resolvesKeys.filter(x => !unionKeys.includes(x))
      const recDiff = unionKeys.filter(x => !resolvesKeys.includes(x))
      console.warn(
        `[Warning] ${union.name}.resolves did not match ${union.name}.fields:`,
        resDiff.length ? resDiff : '', resDiff.length ? 'in resolves, but not union' : '',
        recDiff.length ? recDiff : '', recDiff.length ? 'in union, but not resolves' : ''
      )
    }
  }

  function resolve (state, props, context) {
    const nextState = reducer(state, props, context)
    const union = getRecordName(nextState, props, context)

    if (nextState === false) {
      return false
    }

    const childContext = {...context, requires: context.requires[union], union}
    delete childContext.index

    return Promise.resolve(resolves[union](nextState, props, childContext)).then(
      state => ({[union]: state})
    )
  }

  resolve.each = function resolveEach (state, props, context) {
    let index = 0
    let result = []

    while (true) {
      // copies context so 'index' can be used in async functions without
      // having to worry about mutations
      const acc = resolve(state, props, {...context, index})
      if (acc === false || index > 10) break;
      result.push(acc)
      index += 1
    }

    return Promise.all(result)
  }

  Object.defineProperty(resolve, 'name', {value: union.name})
  Object.defineProperty(resolve, 'resolves', {value: resolves})
  Object.defineProperty(resolve.each, 'name', {value: union.name})
  Object.defineProperty(resolve.each, 'resolves', {value: resolves})
  return resolve
}
