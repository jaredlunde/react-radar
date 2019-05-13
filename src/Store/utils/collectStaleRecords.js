import memoize from 'trie-memoize'
import isStoreRecord from './isStoreRecord'
import {RADAR_CHILDREN_KEY} from './getChildRecords'
import Records from './Records'


const getRecordKeys = memoize([WeakMap], obj => {
  let
    output = {},
    i = 0,
    j = 0,
    objKeys = Object.keys(obj)

  for (; i < objKeys.length; i++) {
    const value = obj[objKeys[i]]

    if (typeof value === 'object' && value !== null) {
      if (isStoreRecord(value) === true) {
        output[value.key] = 0
        const
          children = value[RADAR_CHILDREN_KEY],
          childrenKeys = Object.keys(children)
        // removes the record children
        for (j = 0; j < childrenKeys.length; j++)
          output[children[childrenKeys[j]].key] = 0
      }
      else {
        const nestedValues = getRecordKeys(value)
        if (nestedValues !== void 0 && nestedValues.size > 0) {
          const nestedKeys = Object.keys(nestedValues)
          for (j = 0; j < nestedKeys.length; j++)
            output[nestedKeys[j]] = 0
        }
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
    if (nextKeys[key] === void 0)
      del(key)

  if (__DEV__)
    console.log('[Radar] records:', Records.size, '->', Records)
}