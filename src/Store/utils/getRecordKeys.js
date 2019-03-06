import isPlainObject from '../../utils/isPlainObject'
import isStoreRecord from './isStoreRecord'
import {RADAR_CHILDREN_KEY} from './getChildRecords'
import emptyArr from 'empty/array'


const getRecordKeys = obj => {
  if (isStoreRecord(obj)) {
    const output = []
    const children = obj[RADAR_CHILDREN_KEY]
    const childrenKeys = Object.keys(children)

    // removes the record children
    for (let x = 0; x < childrenKeys.length; x++) {
      output.push(children[childrenKeys[x]].key)
    }
    // removes the top-level record
    output.push(obj.key)

    return output
  }
  else if (Array.isArray(obj) || isPlainObject(obj)) {
    let output = []
    const objKeys = Object.keys(obj)

    for (let x = 0; x < objKeys.length; x++) {
      output = output.concat(getRecordKeys(obj[objKeys[x]]))
    }

    return output
  }

  return emptyArr
}

export default getRecordKeys()