import invariant from 'invariant'
import {defaultRecordReducer} from './createRecordResolver'
import {equalKeys} from './utils'


function defaultGetRecord (state, props, context) {
  return Object.keys(state)[0]
}

export default function createUnionResolver ({
  union,
  resolves,
  reduce = defaultRecordReducer,
  getRecord = defaultGetRecord
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

  async function resolver (state, props, context) {

  }

  resolve.each = function resolveEach (state, props, context) {
    let index = 0
    let result = []

    while (true) {
      // copies context so 'index' can be used in async functions without
      // having to worry about mutations
      const childContext = Object.assign({}, context, {index})
      const acc = resolve(state, props, childContext)
      if (acc === false) break;
      result.push(acc)
      index += 1
    }

    return Promise.all(result)
  }

  Object.defineProperty(resolver, 'name', {value: query.name})
  Object.defineProperty(resolver, 'sync', {value: sync})
  return resolver
}
