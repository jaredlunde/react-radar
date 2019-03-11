import React from 'react'
import PropTypes from 'prop-types'
import {StoreConsumer, RadarConsumer, EndpointConsumer} from '../Store'
import {pick} from '../utils'
import {toShape, toBaseKeys} from './utils'


const whitespace = /\s+/

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

export default Connect