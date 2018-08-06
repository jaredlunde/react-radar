import PropTypes from 'prop-types'
import {StoreConsumer} from '../Store'
import RadarConsumer from '../createEndpoint/EndpointConsumer'
import {pick} from '../utils'
import {toShape, toBaseKeys} from './utils'


export default function Connect ({to, children}) {
  to = typeof to === 'string' ? [to] : to
  const shape = toShape(to)
  const observedKeys = toBaseKeys(shape)
  
  return RadarConsumer({
    children: radar => StoreConsumer({
      observedKeys,
      children: state => children({
        ...pick(state, shape),
        radar
      })
    })
  })
}


Connect.propTypes = {
  to: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string
  ]).isRequired,
  children: PropTypes.func.isRequired
}
