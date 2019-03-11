import React from 'react'
import PropTypes from 'prop-types'
import memoize from 'trie-memoize'
import {StoreConsumer, RadarConsumer, EndpointConsumer} from '../Store'
import {pick} from '../utils'


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
const cache = {}
const toShape = strings => {
  if (cache[strings] !== void 0) {
    return cache[strings]
  }
  else {
    const out = cache[strings] = {}
    strings = strings.split(',')

    for (let x = 0; x < strings.length; x++) {
      const strArr = strings[x].split('.')

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

        for (let y = 1; y < strArr.length; y++) {
          const key = strArr[y]
          nextShape[key] = y === strArr.length - 1 ? null : {}
          nextShape = nextShape[key]
        }

        Object.assign(out[baseKey], shape)
      }
    }

    return out
  }
}

export default Connect