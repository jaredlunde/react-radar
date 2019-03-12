import React from 'react'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import {StoreConsumer, RadarConsumer, EndpointConsumer} from './Store'
import {pick} from './utils'


const Connect = ({to, __internal, __internal_observedKeys, children}) => {
  const shape = toShape(to.replace(whitespace, ''))
  const observedKeys = toBaseKeys(shape)
  const connectChildren = radar => StoreConsumer({
    observedKeys,
    children: state => children(shape ? pick(state, shape) : state, radar)
  })

  return __internal === true
    ? <EndpointConsumer observedKeys={__internal_observedKeys} children={connectChildren}/>
    : RadarConsumer({children: connectChildren})
}

Connect.propTypes = /* remove-proptypes */ {
  to: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired
}

const whitespace = /\s+/
const toBaseKeys = memoize([WeakMap], to => Object.keys(to))
const toShape = memoize([Map], strings => {
  let out = {},
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

      if (out[baseKey] === void 0) {
        out[baseKey] = {}
      }

      const shape = {}
      let nextShape = shape

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

export default Connect