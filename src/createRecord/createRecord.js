import Immutable from 'seamless-immutable'
import {invariant, tag} from '../utils'
import {normalize} from './grammar'
import {recursivelyRequire, getFields, getKeyField, stringify} from './utils'
import defaultReducer from './defaultReducer'
import emptyArr from 'empty/array'
import emptyObj from 'empty/object'


function createRecord ({
  name,
  implement = emptyArr,
  fields = emptyObj,
  initialState = emptyObj,
  reducer = defaultReducer
}) {
  // assigns interfaces that this record implements
  for (let x = 0; x < implement.length; x++) {
    fields = Object.assign({}, fields, implement[x].fields)
  }

  // finds the key field
  const keyField = getKeyField(fields)

  // debug checks in development mode
  if (__DEV__) {
    invariant(name, `Radar Records must include a 'name' option.`)

    invariant(
      Object.keys(fields).length,
      `Record '${name}' must include a 'fields' option.`
    )

    invariant(
      keyField !== void 0,
      `Record '${name}' must include a Radar.Key field.`
    )
  }

  function Record (requestedFields, ...values) {
    let containsFields
    requestedFields = tag(requestedFields, ...values)

    if (__DEV__) {
      try {
        containsFields = getFields(fields, requestedFields)
      } catch (e) {
        throw new Error(`Record '${name}' requested field not found: \n${e}`)
      }
    }

    if (!(__DEV__)) {
      containsFields = getFields(fields, requestedFields)
    }

    // Whenever nodes are received from the server they go through this reducer
    // The node updated is based on the key field of that node
    function RecordReducer (currentState, proposedState) {
      return reducer(
        Object.keys(currentState).length ? currentState : initialState,
        proposedState
      )
    }

    return {
      name,
      keyField,
      reducer: RecordReducer,
      fields,
      containsFields,
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


export default createRecord
