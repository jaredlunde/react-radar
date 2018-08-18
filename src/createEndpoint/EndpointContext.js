import React from 'react'
import {strictShallowEqual} from '@render-props/utils'


export const observe = {
  statusChange: 0b0001,
  responseChange: 0b0010,
  propChange: 0b0100,
  any: 0b0111,
  none: 0b1000
}

function calculateChangedBits (prevValue, nextValue) {
  let bits = 0

  if (prevValue.endpoint.status !== nextValue.endpoint.status) {
    bits |= observe.statusChange
  }

  if (prevValue.endpoint.response !== nextValue.endpoint.response) {
    bits |= observe.responseChange
  }

  if (strictShallowEqual(prevValue.queryProps, nextValue.queryProps) === false) {
    bits |= observe.propChange
  }

  if (bits === 0) {
    return observe.none
  }

  return bits
}

export default React.createContext(
  {
    update: null,
    willUpdate: null,
    commit: null,
    willCommit: null,
    refresh: null,
    setProps: null,
    queryProps: {},
    endpoint: {
      status: null,
      response: null
    },
  },
  calculateChangedBits
)
