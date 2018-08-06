import createStoreRecord from '../createStoreRecord'


export function toRecord (props/*{store, state, query, recordType}*/) {
  props.recordType = (
    props.recordType.reducer === void 0
    ? props.recordType`${props.recordType.keyField}`
    : props.recordType
  )

  return createStoreRecord(props)
}


function fromPlainObject (props/*{store, state, query, recordType, ...context}*/) {
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

    output[key] = toRecords(mutableBaseRecord)
  }

  if (
    recordType && (
      recordType.isRadarRecord  // sub record
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


function fromArray({...mutableProps}/*{store, state, query, recordType}*/) {
  const records = []
  const state = mutableProps.state

  for (let x = 0; x < state.length; x++) {
    mutableProps.state = state[x]
    records.push(toRecords(mutableProps))
  }

  return records
}


function toRecords (props/*{store, state, query, recordType}*/) {
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


export default toRecords
