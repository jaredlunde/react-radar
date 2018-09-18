import isPlainObject from '../../utils/isPlainObject'
import {RADAR_ID_KEY} from './invalidateID'
import isStoreRecord from './isStoreRecord'


function recordDidChange (prevRecord, nextRecord) {
  if (prevRecord[RADAR_ID_KEY] !== nextRecord[RADAR_ID_KEY]) {
    return true
  }

  return nextRecord.isInvalid()
}


export default function stateDidChange (prevState, nextState) {
  if (nextState === null || nextState === void 0) {
    return false
  }

  const prevStateKeys = Object.keys(prevState)
  const nextStateKeys = Object.keys(nextState)

  if (prevStateKeys.length !== nextStateKeys.length) {
    return true
  }

  for (let x = 0; x < nextStateKeys.length; x++) {
    const key = nextStateKeys[x]
    const nextVal = nextState[key]
    const prevVal = prevState[key]

    if (
      (Array.isArray(nextVal) || isPlainObject(nextVal))
      && prevVal !== null
      && typeof prevVal === 'object'
    ) {
      const nextKeys = Object.keys(nextVal)

      // traverse descending because the assumption is most mutations will
      // be pushes rather than shifts
      for (let y = nextKeys.length; y > -1; y--) {
        const nextKey = nextKeys[y]
        const nextRec = nextVal[nextKey]
        const prevRec = prevVal[nextKey]
        // if its a record and unequal, we know it is invalid. with other
        // values, we just don't want to go any deeper
        if (nextRec !== prevRec) {
          return true
        }
        else if (isStoreRecord(nextRec) && recordDidChange(prevRec, nextRec) === true) {
          return true
        }
      }
    }
    else if (nextVal !== prevVal) {
      return true
    }
    else if (isStoreRecord(nextVal) && recordDidChange(prevVal, nextVal) === true) {
      return true
    }
  }

  return false
}
