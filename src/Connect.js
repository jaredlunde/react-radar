import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import emptyObj from 'empty/object'
import memoize from 'trie-memoize'
import {StoreContext, StoreConsumer, RadarConsumer, EndpointConsumer} from './Store'
import {pick} from './utils'


const Connect = ({to, __internal, __internal_observedKeys, children}) => {
  const shape =
    to && toShape(to.replace(whitespace, '')),
    observedKeys = toBaseKeys(shape || emptyObj),
    connectChildren = radar => StoreConsumer({
      observedKeys,
      children: state => children(shape ? pick(state, shape) : state, radar)
    })

  return __internal === true
    ? <EndpointConsumer observedKeys={__internal_observedKeys} children={connectChildren}/>
    : RadarConsumer({children: connectChildren})
}

Connect.propTypes = /* remove-proptypes */ {
  to: PropTypes.string,
  children: PropTypes.func.isRequired
}

const whitespace = /\s+/
const toBaseKeys = memoize([WeakMap], to => Object.keys(to))
const toShape = memoize([Map], strings => {
  let
    out = {},
    i = 0,
    j = 0
  strings = strings.split(',')

  for (; i < strings.length; i++) {
    const strArr = strings[i].split('.')

    if (strArr.length === 1) {
      out[strArr[0]] = null
    }
    else {
      const baseKey = strArr[0]

      if (out[baseKey] === void 0)
        out[baseKey] = {}

      let
        shape = {},
        nextShape = shape

      for (j = 1; j < strArr.length; j++) {
        const key = strArr[j]
        nextShape[key] = j === strArr.length - 1 ? null : {}
        nextShape = nextShape[key]
      }

      Object.assign(out[baseKey], shape)
    }
  }

  return out
})

export const useConnect = (...to) => {
  const shape = to.length && toShape(to.join(','))
  // TODO: Remove comments below when useContext() supports observed bits
  // const observedKeys = toBaseKeys(shape)
  // const getBits = useContext(StoreInternalContext)
  // if (getBits === null) return emptyObj
  const {data} = useContext(StoreContext/*, getBits(observedKeys)*/)
  return shape ? pick(data, shape) : data
}

export default Connect