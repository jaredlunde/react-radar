import memoize from 'trie-memoize'
import isStoreRecord from './isStoreRecord'
import {RADAR_CHILDREN_KEY} from './getChildRecords'
import Records from './Records'


const getRecordKeys = memoize([WeakMap], obj => {
  let
    output = new Set(),
    i = 0,
    j = 0,
    objKeys = Object.keys(obj)

  for (; i < objKeys.length; i++) {
    const value = obj[objKeys[i]]

    if (typeof value === 'object' && value !== null) {
      if (isStoreRecord(value) === true) {
        output.add(value.key)
        const
          children = value[RADAR_CHILDREN_KEY],
          childrenKeys = Object.keys(children)
        // removes the record children
        for (j = 0; j < childrenKeys.length; j++)
          output.add(children[childrenKeys[j]].key)
      }
      else {
        const nestedValues = getRecordKeys(value)
        if (nestedValues !== void 0 && nestedValues.size > 0)
          for (let k of nestedValues)
            output.add(k)
      }
    }
  }

  return output
})

const del = Records.delete.bind(Records)

export default nextState => {
  if (Records.size === 0) return
  const nextKeys = getRecordKeys(nextState)

  for (let key of Records.keys())
    if (nextKeys.has(key) === false)
      del(key)

  if (__DEV__)
    console.log('[Radar] records:', Records.size, '->', Records)
}