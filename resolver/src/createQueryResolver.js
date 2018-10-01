import invariant from 'invariant'
import {Field, ObjectField} from './fields'
import {promiseAllValues} from './utils'


function getRequiredField (name, field, childFields) {
  if (
    field === null
    || (field instanceof Field && !(field instanceof ObjectField))
  ) {
    return null
  }
  else {
    return getRequiredFields(name, field, childFields)
  }
}

function getRequiredFields (name, record, requires) {
  const fields = {}

  if (
    requires === void 0
    || requires === null
    || Object.keys(requires).length === 0
  ) {
    for (let name in record.resolves) {
      fields[name] = getRequiredField(name, record.resolves[name])
    }
  }
  else {
    for (let fieldName in requires) {
      const field = record.resolves[fieldName]
      const childFields = requires[fieldName]

      if (field === void 0) {
        const isObjectField = record instanceof ObjectField
        const mapType = isObjectField ? 'ObjectField' : 'Record'
        const recName = isObjectField ? name : record.name
        throw `Field '${fieldName}' not found in ${mapType}: ${recName}`
      }

      fields[fieldName] = getRequiredField(fieldName, field, childFields)
    }
  }

  return fields
}

function getRequiredRecords (resolves, requires) {
  let required = {}
  const recordNames = Object.keys(requires)

  if (recordNames.length > 0) {
    for (let name of recordNames) {
      required[name] = getRequiredFields(name, resolves[name], requires[name])
    }
  }
  else {
    for (let name in resolves) {
      required[name] = getRequiredFields(name, resolves[name])
    }
  }

  return required
}

function defaultStateGetter (props, context) {
  const result = {}

  for (let key in context.requires) {
    result[key] = props[key]
  }

  return result
}

export default function createQueryResolver ({
  query,
  resolves,
  getState = defaultStateGetter,
  sync = false
}) {
  if (__DEV__) {
    invariant(
      query !== void 0,
      `Query resolvers require a 'query' property be defined.`
    )

    invariant(
      resolves !== void 0 && resolves.length !== 0,
      `Query resolvers require a 'resolves' property be defined.`
    )

    invariant(
      getState !== void 0,
      `Query resolvers require a 'getState' function which returns the state ` +
      `of the query matching the provided 'resolves' shape.`
    )
  }

  async function resolver (props, context) {
    context = {...context, query}
    const result = {}

    if (typeof resolves === 'function') {
      // resolves can be a function because queries can resolve to dynamic
      // keys
      resolves = resolves(props, context)
    }

    const required = getRequiredRecords(resolves, context.requires)
    const state = await getState(required, props, context)

    for (let recordName in required) {
      if (state && state[recordName] === void 0) {
        throw `Record for '${recordName}' was undefined in ${query.name} `
      }

      result[recordName] =
        state[recordName] === null
          ? null
          : resolves[recordName](
              state[recordName],
              props,
              {
                ...context,
                record: resolves[recordName],
                requires: required[recordName]
              }
            )
    }

    return promiseAllValues(result)
  }

  Object.defineProperty(resolver, 'name', {value: query.name})
  Object.defineProperty(resolver, 'sync', {value: sync})
  return resolver
}
