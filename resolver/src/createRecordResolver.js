import invariant from 'invariant'
import {Field, ObjectField} from './fields'
import {promiseAllValues, equalKeys} from './utils'


export function defaultRecordReducer (state, props, context) {
  if (state === null) {
    return state
  }

  if (context.index !== void 0) {
    // bails out of resolve.each iteration when the index has been surpassed
    if (context.index >= state.length) {
      return false
    }

    if (context.index !== void 0) {
      state = state[context.index]
    }
  }

  if (context.union !== void 0) {
    state = state[context.union]
  }

  return state
}


export default function createRecordResolver ({
  record,
  resolves,
  reducer = defaultRecordReducer
}) {
  if (__DEV__) {
    invariant(
      record !== void 0,
      `Record resolvers require a 'record' property be defined.`
    )

    invariant(
      resolves !== void 0,
      `Record resolvers require a 'resolves' property be defined.`
    )

    for (let key in resolves) {
      invariant(
        record.fields.hasOwnProperty(key) === true,
        `Field '${key}' of 'resolves' was not found in record: ${record.name}`
      )
    }

    if (equalKeys(resolves, record.fields) === false) {
      const resolvesKeys = Object.keys(resolves)
      const recordKeys = Object.keys(record.fields)
      const resDiff = resolvesKeys.filter(x => !recordKeys.includes(x))
      const recDiff = recordKeys.filter(x => !resolvesKeys.includes(x))
      console.warn(
        `[Warning] ${record.name}.resolves did not match ${record.name}.fields:`,
        resDiff.length ? resDiff : '', resDiff.length ? 'in resolves, but not record' : '',
        recDiff.length ? recDiff : '', recDiff.length ? 'in record, but not resolves' : ''
      )
    }
  }

  function resolveField (state, props, context) {
    const field = resolves[context.fieldName]

    if (field instanceof Field && !(field instanceof ObjectField)) {
      return field(state, props, context)
    }
    else {
      // Records
      return field(state[context.fieldName], props, context)
    }
  }

  function resolveFields (state, props, context) {
    let result = {}

    if (context.requires === null) {
      for (let fieldName in resolves) {
        const childContext = {...context, fieldName, index: void 0}
        result[fieldName] = resolveField(state, props, childContext)
      }
    }
    else {
      for (let fieldName in context.requires) {
        const childContext = {
          ...context,
          fieldName,
          requires: context.requires[fieldName],
          index: void 0
        }
        result[fieldName] = resolveField(
          state,
          props,
          childContext
        )
      }
    }

    return result
  }

  function resolve (state, props, context) {
    const nextState = reducer(state, props, context)

    if (nextState === false) {
      return false
    }

    const result = resolveFields(nextState, props, context)

    // sets the key field if it wasn't specifically requested
    if (result[record.keyField] === void 0) {
      const childContext = {
        ...context,
        fieldName: record.keyField,
        requires: context.requires[record.keyField],
        index: void 0
      }
      result[record.keyField] = resolveField(nextState, props, childContext)
    }

    if (
      result[record.keyField] === void 0
      || result[record.keyField] === null
    ) {
      throw (
        `Key field '${record.keyField}' returned null or undefined in ` +
        `Record: ${record.name}`
      )
    }

    return promiseAllValues(result)
  }

  resolve.each = function resolveEach (state, props, context) {
    let index = 0
    let result = []

    while (true) {
      // copies context so 'index' can be used in async functions without
      // having to worry about mutations
      const acc = resolve(state, props, {...context, index})
      if (acc === false) break;
      result.push(acc)
      index += 1
    }

    return Promise.all(result)
  }

  resolve.resolves = resolves
  resolve.each.resolves = resolves
  Object.defineProperty(resolve, 'name', {value: record.name})
  Object.defineProperty(resolve.each, 'name', {value: record.name})
  return resolve
}
