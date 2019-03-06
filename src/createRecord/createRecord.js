import emptyObj from 'empty/object'
import {invariant, tag, deepMerge, arrayMergeReplace, isSubset} from '../utils'
import {getFields, getKeyField, stringify} from './utils'


export const defaultReducer = (
  state,     /*Current GLOBAL state of the record @ current key*/
  nextState  /*The new state being proposed via some mutation*/
) => {
  if (isSubset(state, nextState)) {
    return state
  }

  return deepMerge(state, nextState, {arrayMerge: arrayMergeReplace})
}

export default ({
  fields = emptyObj,
  initialState = emptyObj,
  reducer = defaultReducer
}) => {
  // finds the key field
  const keyField = getKeyField(fields)
  let name

  // debug checks in development mode
  if (__DEV__) {
    name = `Record(${Object.keys(fields).join(', ')})`

    invariant(
      Object.keys(fields).length,
      `[${name}] must include a 'fields' option.`
    )

    invariant(
      keyField !== void 0,
      `[${name}] must include a Radar.Key field.`
    )
  }

  // Whenever nodes are received from the server they go through this reducer
  // The node updated is based on the key field of that node
  function RecordReducer (currentState, proposedState) {
    return reducer(
      Object.keys(currentState).length ? currentState : initialState,
      proposedState
    )
  }

  function Record (requestedFields, ...values) {
    let requiresFields
    requestedFields = tag(requestedFields, values)

    if (__DEV__) {
      try {
        requiresFields = getFields(fields, requestedFields)
      } catch (e) {
        throw new Error(`[${name}] requested field not found: \n${e}`)
      }
    }

    if (!(__DEV__)) {
      requiresFields = getFields(fields, requestedFields)
    }

    return {
      keyField,
      reducer: RecordReducer,
      fields,
      requiresFields,
      toString: function () {
        return requestedFields.length ? requestedFields : stringify(fields)
      }
    }
  }

  // Name the node and ID it as a Radar Record
  Record.keyField = keyField
  Record.fields = fields
  Record.isRadarRecord = true

  return Record
}
