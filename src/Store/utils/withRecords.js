import toRecords from './toRecords'


export default function ({store, nextState, queries, queryProps, ...context}) {
  let stateWithRecords = {}
  const mutableBaseRecordData = {store, queryProps, ...context}

  for (let x = 0; x < queries.length; x++) {
    const state = nextState[x]

    if (state === null || state === void 0) {
      continue
    }

    const stateKeys = Object.keys(state)
    const query = queries[x](queryProps)
    mutableBaseRecordData.query = query

    for (let y = 0; y < stateKeys.length; y++) {
      const key = stateKeys[y]
      mutableBaseRecordData.recordType = query.contains[key]
      mutableBaseRecordData.state = state[key]
      stateWithRecords[key] = toRecords(mutableBaseRecordData)
    }
  }

  return stateWithRecords
}
