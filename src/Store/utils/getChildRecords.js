import memoize from 'trie-memoize'
import emptyObj from 'empty/object'
import {isPlainObject} from '../../utils'
import isStoreRecord from './isStoreRecord'
import {RADAR_ID_KEY} from './invalidateID'


export const RADAR_CHILDREN_KEY = '__@@RADAR_CHILDREN@@__'

const getRecordsFromPlainObject = memoize(
  [WeakMap],
  obj => {
    const stateKeys = Object.keys(obj)
    let children = {},
        i = 0,
        j = 0

    for (; i < stateKeys.length; i++) {
      const nextChildren = getChildRecords(obj[stateKeys[i]])
      const childKeys = Object.keys(nextChildren)

      for (j = 0; j < childKeys.length; j++)
        children[childKeys[j]] = nextChildren[childKeys[j]]
    }

    return children
  }
)


const getChildRecords = obj => {
  if (isStoreRecord(obj)) {
    const childRecs = getChildRecords(obj.state)
    childRecs[obj[RADAR_ID_KEY]] = obj
    return childRecs
  }
  else if (isPlainObject(obj) || Array.isArray(obj)) {
    return getRecordsFromPlainObject(obj)
  }

  return emptyObj
}


export default getChildRecords
