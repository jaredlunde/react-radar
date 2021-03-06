import memoize from 'trie-memoize'
import emptyObj from 'empty/object'
import {isPlainObject} from '../../utils'
import isStoreRecord from './isStoreRecord'
import {RADAR_ID_KEY} from './invalidateID'


export const RADAR_CHILDREN_KEY = Symbol.for('radar.children')

const getRecordsFromPlainObject = memoize(
  [WeakMap],
  obj => {
    let
      stateValues = Object.values(obj),
      children = {},
      i = 0,
      j = 0

    for (; i < stateValues.length; i++) {
      const
        nextChildren = getChildRecords(stateValues[i]),
        childKeys = Object.keys(nextChildren)

      for (j = 0; j < childKeys.length; j++)
        children[childKeys[j]] = nextChildren[childKeys[j]]
    }

    return children
  }
)

const getRecordsFromRecord = memoize(
  [WeakMap, Map],
  (_, obj) => Object.assign({[obj[RADAR_ID_KEY]]: obj}, obj[RADAR_CHILDREN_KEY])
)

const getChildRecords = obj => {
  if (isStoreRecord(obj) === true) {
    // const childRecs = Object.assign({}, getChildRecords(obj.state))
    // childRecs[obj[RADAR_ID_KEY]] = obj
    // return childRecs
    return getRecordsFromRecord(obj.state, obj)
  }
  else if (Array.isArray(obj) === true || isPlainObject(obj) === true) {
    return getRecordsFromPlainObject(obj)
  }

  return emptyObj
}


export default getChildRecords
