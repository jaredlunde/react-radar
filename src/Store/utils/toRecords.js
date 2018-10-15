import createStoreRecord from './createStoreRecord'
import deepInvalidate from './deepInvalidate'


export function toRecord (props/*{state, query, recordType}*/) {
  props.recordType = (
    props.recordType.reducer === void 0
    ? props.recordType`${props.recordType.keyField}`
    : props.recordType
  )

  return createStoreRecord(props)
}


function fromPlainObject (props/*{state, query, recordType, ...context}*/) {
  const output = {}
  const recordType = props.recordType
  const state = props.state
  const stateKeys = Object.keys(state)
  const mutableBaseRecord = Object.assign({}, props)

  for (let x = 0; x < stateKeys.length; x++) {
    const key = stateKeys[x]
    mutableBaseRecord.state = state[key]
    mutableBaseRecord.recordType = (
      recordType === void 0
      ? void 0
      : recordType.fields
        ? recordType.fields[key]
        : recordType[key]
    )

    output[key] = routeToRecords(mutableBaseRecord)
  }

  if (
    recordType && (
      recordType.isRadarRecord           // sub record
      || recordType.keyField !== void 0  // top-level
    )
  ) {
    // is a record
    mutableBaseRecord.state = output
    mutableBaseRecord.recordType = recordType
    return toRecord(mutableBaseRecord)
  }

  // is not a record or union
  return output
}


function fromArray(props/*{state, query, recordType}*/) {
  const mutableProps = Object.assign({}, props)
  const records = []
  const state = mutableProps.state

  for (let x = 0; x < state.length; x++) {
    mutableProps.state = state[x]
    records.push(routeToRecords(mutableProps))
  }

  return records
}


function routeToRecords (props/*{state, query, recordType}*/) {
  const state = props.state

  if (Array.isArray(state)) {
    return fromArray(props)
  }
  else if (state === null) {
    return state
  }
  else if (typeof state === 'object') {
    return fromPlainObject(props)
  }

  return typeof props.recordType === 'function' ? props.recordType(state) : state
}


export default function parse ({state, nextState, queries, ...context}) {
  let hasRecordUpdates = false

  for (let i = 0; i < queries.length; i++) {
    let queryState = nextState[i]
    const query = queries[i]
    context.query = query
    let records = {}

    if (query.isRecordUpdate === true) {
      hasRecordUpdates = true
    }

    if (queryState === null || queryState === void 0) {
      continue
    }
    else if (queryState.isRadarError === true) {
      context.hasErrors = true
      queryState = {...queryState}
      delete queryState.isRadarError
      state = query.reducer(state, queryState, context)
      continue
    }

    const stateKeys = Object.keys(queryState)
    context.hasErrors = false

    for (let j = 0; j < stateKeys.length; j++) {
      const key = stateKeys[j]
      context.recordType = query.requires[key]
      context.state = queryState[key]
      records[key] = routeToRecords(context)
    }
    delete context.recordType
    delete context.state
    state = query.reducer(state, records, context)
  }

  if (hasRecordUpdates === true) {
    state = deepInvalidate(state)
  }

  return state
}
