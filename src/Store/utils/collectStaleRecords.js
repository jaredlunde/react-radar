import memoize from 'trie-memoize'
import isStoreRecord from './isStoreRecord'
import {RADAR_CHILDREN_KEY} from './getChildRecords'
import Records from './Records'


const getRecordKeys = memoize([WeakMap], obj => {
  let
    // logically, output should be a Set() here, however due to painfully slow Set iteration
    // by comparison to Object iteration, it's an Object instead
    output = {},
    i = 0,
    j = 0,
    objValues = Array.isArray(obj) === true ? obj : Object.values(obj)

  for (; i < objValues.length; i++) {
    const value = objValues[i]

    if (typeof value === 'object' && value !== null) {
      if (isStoreRecord(value) === true) {
        output[value.key] = value.key
        const childrenKeys = Object.values(value[RADAR_CHILDREN_KEY])
        // removes the record children
        for (j = 0; j < childrenKeys.length; j++) {
          const key = childrenKeys[j].key
          output[key] = key
        }
      }
      else {
        const nestedValues = Object.values(getRecordKeys(value))
        for (j = 0; j < nestedValues.length; j++)
          output[nestedValues[j]] = nestedValues[j]
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

  // if (__DEV__)
  //   console.log('[Radar] records:', Records.size, '->', Records)
}
/*
const bench = require('@essentials/benchmark').default
const m = new Map()
for (let i = 0; i < 10000; i++)
  m.set(i, i)
bench(() => { for (let key of m.keys()) key })
bench(() => { for (let value of m.values()) value })
*/

/*
 const bench = require('@essentials/benchmark').default
 const m = {}
 for (let i = 0; i < 10000; i++)
 m[i] = i
 bench(() => {
 const keys = Object.keys(m)
 for (let i = 0; i < keys.length; i++) keys[i]
 })
 bench(() => {
 const values = Object.values(m)
 for (let i = 0; i < values.length; i++) values[i]
 })
*/
