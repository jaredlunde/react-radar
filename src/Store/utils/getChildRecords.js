import memoize from 'trie-memoize'
import isStoreRecord from './isStoreRecord'
import {isPlainObject} from '../../utils'
import {RADAR_ID_KEY} from './invalidateID'
import emptyObj from 'empty/object'


export const RADAR_CHILDREN_KEY = '__@@RADAR_CHILDREN@@__'

const getRecordsFromPlainObject = memoize(
  [WeakMap],
  obj => {
    const stateKeys = Object.keys(obj)
    let children = {}
    let x

    for (let x = 0; x < stateKeys.length; x++) {
      const nextChildren = getChildRecords(obj[stateKeys[x]])
      const childKeys = Object.keys(nextChildren)

      for (let x = 0; x < childKeys.length; x++) {
        const childKey = childKeys[x]
        children[childKey] = nextChildren[childKey]
      }
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
