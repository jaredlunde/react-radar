import memoize from 'trie-memoize'
import {isPlainObject} from '../../utils'
import isStoreRecord from './isStoreRecord'
import {RADAR_CHILDREN_KEY} from './getChildRecords'
import Records from './Records'


const getRecordKeys = memoize([WeakMap], obj => {
  if (isStoreRecord(obj)) {
    const output = new Set()
    const children = obj[RADAR_CHILDREN_KEY]
    const childrenKeys = Object.keys(children)
    // removes the record children
    for (let x = 0; x < childrenKeys.length; x++)
      output.add(children[childrenKeys[x]].key)
    // removes the top-`level record
    output.add(obj.key)
    return output
  }
  else if (Array.isArray(obj) || isPlainObject(obj)) {
    let output = new Set()
    const objKeys = Object.keys(obj)

    for (let x = 0; x < objKeys.length; x++) {
      const value = obj[objKeys[x]]

      if (typeof value === 'object' && value !== null) {
        const nestedValues = getRecordKeys(value)

        if (nestedValues !== void 0 && nestedValues.size) {
          for (let k of nestedValues) output.add(k)
        }
      }
    }

    return output
  }
})


export default (nextState) => {
  if (Records.size === 0) {
    return
  }

  const nextKeys = getRecordKeys(nextState)

  for (let [key, _] of Records) {
    if (nextKeys.has(key) === false) {
      Records.delete(key)
    }
  }

  if (__DEV__) {
    console.log('[Radar] records:', Records.size, '->', Records)
  }
}