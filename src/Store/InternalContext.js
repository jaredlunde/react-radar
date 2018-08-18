import React from 'react'
import emptyObj from 'empty/object'

const InternalContext = React.createContext(emptyObj)
export default InternalContext
export const InternalProvider = InternalContext.Provider
export const InternalConsumer = InternalContext.Consumer
