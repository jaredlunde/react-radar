import React from 'react'
import PropTypes from 'prop-types'
import {StoreConsumer, EndpointConsumer} from '../Store'
import {pick} from '../utils'
import {toShape, toBaseKeys} from './utils'


const whitespace = /\s+/

const Connect = ({to, children}) => {
  const shape = toShape(to.replace(whitespace, ''))
  const observedKeys = toBaseKeys(shape)

  return <EndpointConsumer children={
    radar => StoreConsumer({
      observedKeys,
      children: state => children(shape ? pick(state, shape) : state, radar)
    })
  }/>
}

Connect.propTypes = /* remove-proptypes */ {
  to: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired
}

export default Connect