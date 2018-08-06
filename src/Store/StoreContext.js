import React from 'react'
import emptyObj from 'empty/object'
import StoreConnections from './StoreConnections'
import BitMask from '../utils/BitMask'


function calculateChangedBits (prev, next) {
  const prevValue = prev.data
  const nextValue = next.data
  const nextKeys = Object.keys(nextValue)
  const prevKeys = Object.keys(prevValue)
  let valA, valB, keysA, keysB, len
  // console.log('Calculating changed bits between:', prevValue, next)
  // console.log('Store', next.store)

  if (prevKeys.length > nextKeys.length) {
    len = prevKeys.length
    valA = prevValue
    keysA = prevKeys
    valB = nextValue
    keysB = nextKeys
  }
  else {
    len = nextKeys.length
    valA = nextValue
    keysA = nextKeys
    valB = prevValue
    keysB = prevKeys
  }

  let x = 0
  const changedKeys = []

  for (x; x < len; x++) {
    const keyA = keysA[x]
    const keyB = keysB[x]

    if (keyB === void 0 || valA[keyA] !== valB[keyB]) {
      changedKeys.push(keyA)
    }

    if (keysB.indexOf(keyA) === -1 && changedKeys.indexOf(keyA) === -1) {
      changedKeys.push(keyA)
    }
  }

  const bits = next.getChangedBits(changedKeys)
  // console.log('Changed keys:', changedKeys)
  // console.log('Changed bits:', (bits).toString(2))
  return bits
}


export default React.createContext(emptyObj, calculateChangedBits)
