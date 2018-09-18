import React from 'react'
import PropTypes from 'prop-types'
import {StoreConsumer, EndpointConsumer} from '../Store'
import {pick} from '../utils'
import {toShape, toBaseKeys} from './utils'


const whitespace = /\s+/

export default function Connect ({to, children}) {
  const shape = toShape(to.replace(whitespace, ''))
  const observedKeys = toBaseKeys(shape)

  return <EndpointConsumer children={
    radar => StoreConsumer({
      observedKeys,
      children: state => children(pick(state, shape), radar)
    })
  }/>
}


Connect.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired
}
