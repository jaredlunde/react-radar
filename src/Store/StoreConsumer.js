import React from 'react'
import StoreContext from './StoreContext'
import InternalContext from './InternalContext'
import StoreConnections from './StoreConnections'


export default function StoreConsumer (props) {
  function Renderer (state) {
    return props.children(
      typeof props.reducer === 'function'
      ? props.reducer(state.data)
      : state.data
    )
  }

  return (
    <InternalContext.Consumer>
      {cxt => (
        <StoreContext.Consumer
          unstable_observedBits={
            typeof cxt === void 0 || cxt === null || typeof cxt.getBits !== 'function'
              || props.observedKeys === void 0
              || props.observedKeys.length === 0
            ? 2147483647 // 0b1111111111111111111111111111111
            : cxt.getBits(props.observedKeys)
          }
        >
          {Renderer}
        </StoreContext.Consumer>
      )}
    </InternalContext.Consumer>
  )
}
