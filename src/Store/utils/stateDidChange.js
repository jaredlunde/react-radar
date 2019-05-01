import isPlainObject from '../../utils/isPlainObject'
import {RADAR_ID_KEY} from './invalidateID'
import isStoreRecord from './isStoreRecord'


const recordDidChange = (prevRecord, nextRecord) => {
  if (prevRecord[RADAR_ID_KEY] !== nextRecord[RADAR_ID_KEY])
    return true

  return nextRecord.isInvalid()
}


export default (prevState, nextState) => {
  if (nextState === null || nextState === void 0)
    return false

  let nextStateKeys = Object.keys(nextState), i = 0, j = 0

  for (; i < nextStateKeys.length; i++) {
    const
      key = nextStateKeys[i],
      nextVal = nextState[key],
      prevVal = prevState[key]
    if (nextVal !== prevVal) {
      return true
    }
    else if (isStoreRecord(nextVal) === true && recordDidChange(prevVal, nextVal) === true) {
      return true
    }
    else if (
      (Array.isArray(nextVal) === true || isPlainObject(nextVal) === true)
      && typeof prevVal === 'object'
      && prevVal !== null
    ) {
      const nextKeys = Object.keys(nextVal)

      // traverse descending because the assumption is most mutations will
      // be pushes rather than shifts
      for (j = nextKeys.length; j > -1; j--) {
        const
          nextKey = nextKeys[j],
          nextRec = nextVal[nextKey],
          prevRec = prevVal[nextKey]
        // if its a record and unequal, we know it is invalid. with other
        // values, we just don't want to go any deeper
        if (nextRec !== prevRec)
          return true
        else if (isStoreRecord(nextRec) === true && recordDidChange(prevRec, nextRec) === true)
          return true
      }
    }
  }

  return false
}
