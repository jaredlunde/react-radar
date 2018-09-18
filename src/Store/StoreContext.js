import React from 'react'
import emptyObj from 'empty/object'
import InternalContext from './InternalContext'


const StoreContext = React.createContext(emptyObj, calculateChangedBits)
export default StoreContext

function calculateChangedBits (prev, next) {
  const prevValue = prev.state
  const nextValue = next.state
  const nextKeys = Object.keys(nextValue)
  const prevKeys = Object.keys(prevValue)
  let valA, valB, keysA, keysB, len
  // console.log('Calculating changed bits between:', prevValue, next)
  // console.log('Store', next.store)

  if (prevKeys.length > nextKeys.length) {
    len = prevKeys.length
    valA = prevValue
    keysA = prevKeys
    valB = nextValue
    keysB = nextKeys
  }
  else {
    len = nextKeys.length
    valA = nextValue
    keysA = nextKeys
    valB = prevValue
    keysB = prevKeys
  }

  let x = 0
  const changedKeys = []

  for (x; x < len; x++) {
    const keyA = keysA[x]
    const keyB = keysB[x]

    if (keyB === void 0 || valA[keyA] !== valB[keyB]) {
      changedKeys.push(keyA)
    }

    if (keysB.indexOf(keyA) === -1 && changedKeys.indexOf(keyA) === -1) {
      changedKeys.push(keyA)
    }
  }

  const bits = next.getBits(changedKeys)
  return bits
}

export function StoreConsumer (props) {
  function Renderer ({state}) {
    return props.children(
      typeof props.reducer === 'function'
        ? props.reducer(state)
        : state
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
