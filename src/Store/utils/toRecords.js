import {objectWithoutProps} from '../../utils'
import createStoreRecord from './createStoreRecord'
import deepInvalidate from './deepInvalidate'


const toRecord = (props/*{state, query, recordType}*/) => {
  props.recordType = (
    props.recordType.reducer === void 0
    ? props.recordType`${props.recordType.keyField}`
    : props.recordType
  )

  return createStoreRecord(props)
}


const fromPlainObject = (props/*{state, query, recordType, ...context}*/) => {
  const output = {}
  const recordType = props.recordType
  const state = props.state
  const stateKeys = Object.keys(state)
  const mutableBaseRecord = Object.assign({}, props)

  for (let i = 0; i < stateKeys.length; i++) {
    const key = stateKeys[i]
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


const fromArray = (props/*{state, query, recordType}*/) => {
  const mutableProps = Object.assign({}, props)
  const records = []
  const state = mutableProps.state

  for (let i = 0; i < state.length; i++) {
    mutableProps.state = state[i]
    records.push(routeToRecords(mutableProps))
  }

  return records
}


const routeToRecords = (props/*{state, query, recordType}*/) => {
  const state = props.state

  if (Array.isArray(state) === true) {
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


const withoutError = ['isRadarError']
const withoutContext = ['recordType', 'state']

export default ({state, nextState, queries, ...context}) => {
  let hasRecordUpdates = false, i = 0, j = 0

  for (; i < queries.length; i++) {
    let records = {}
    let queryState = nextState[i]
    const query = queries[i]
    context.query = query

    if (query.isRecordUpdate === true) {
      hasRecordUpdates = true
    }

    if (queryState === null || queryState === void 0) {
      continue
    }
    else if (queryState.isRadarError === true) {
      context.hasErrors = true
      queryState = objectWithoutProps(queryState, withoutError)
      state = query.reducer(state, queryState, context)
      continue
    }

    const stateKeys = Object.keys(queryState)
    context.hasErrors = false

    if (query.requires !== void 0) {
      for (j = 0; j < stateKeys.length; j++) {
        const key = stateKeys[j]
        context.recordType = query.requires[key]
        context.state = queryState[key]
        records[key] = routeToRecords(context)
      }
    }
    else {
      records = queryState
    }

    state = query.reducer(state, records, objectWithoutProps(context, withoutContext))
  }

  if (hasRecordUpdates === true) {
    state = deepInvalidate(state)
  }

  return state
}
