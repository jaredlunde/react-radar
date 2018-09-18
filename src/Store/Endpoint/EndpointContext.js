import React from 'react'
import emptyObj from 'empty/object'


const EndpointContext = React.createContext(emptyObj)
export default EndpointContext
export const EndpointConsumer = EndpointContext.Consumer
