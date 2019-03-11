import React from 'react'
import emptyObj from 'empty/object'
import {calculateChangedBits} from '../StoreContext'


export const EndpointInternalContext = React.createContext(null)
export const EndpointContext = React.createContext(emptyObj, calculateChangedBits('queries'))
export const EndpointConsumer = ({children, observedKeys}) =>
  <EndpointInternalContext.Consumer children={
    getBits => <EndpointContext.Consumer
      unstable_observedBits={
        typeof getBits !== 'function'
        || observedKeys === void 0
        || observedKeys.length === 0
          ? 2147483647 // 0b1111111111111111111111111111111
          : getBits(observedKeys)
      }
      children={children}
    />
  }/>
export const RadarConsumer = props => <EndpointConsumer children={
  ({commit, commitLocal}) => props.children({commit, commitLocal})
}/>