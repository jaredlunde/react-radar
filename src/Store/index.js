import React, {useContext} from 'react'
import {EndpointContext} from './EndpointContext'

export default from './Store'
export createCache from './createCache'
export {isStoreRecord} from './utils'
export {StoreConsumer, StoreContext} from './StoreContext'
export {EndpointContext, RadarConsumer, EndpointConsumer} from './EndpointContext'
export const useRadar = () => {
  const radar = useContext(EndpointContext)
  return typeof radar !== null && {commit: radar.commit, commitLocal: radar.commitLocal}
}