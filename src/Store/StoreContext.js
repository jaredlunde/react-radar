import React from 'react'


export const calculateChangedBits = stateKey => (prev, next) => {
  let valA, valB, keysA, keysB
  const prevKeys =  Object.keys(prev[stateKey]),
        nextKeys =  Object.keys(next[stateKey])

  if (prevKeys.length > nextKeys.length) {
    keysA = prevKeys
    valA = prev[stateKey]
    keysB = nextKeys
    valB = next[stateKey]
  }
  else {
    keysA = nextKeys
    valA = next[stateKey]
    keysB = prevKeys
    valB = prev[stateKey]
  }

  let i = 0,
      changedKeys = []

  for (i; i < keysA.length; i++) {
    const keyA = keysA[i]
    const keyB = keysB[i]

    if (keyB === void 0 || valA[keyA] !== valB[keyB]) {
      changedKeys.push(keyA)
    }
    else if (keysB.indexOf(keyA) === -1 && changedKeys.indexOf(keyA) === -1) {
      changedKeys.push(keyA)
    }
  }

  return next.getBits(changedKeys)
}

export const InternalContext = React.createContext(null)
const StoreContext = React.createContext({}, calculateChangedBits('state'))
export default StoreContext

export const StoreConsumer = ({children, observedKeys}) => {
  const Renderer = ({state}) => children(state)

  return (
    <InternalContext.Consumer>
      {getBits => (
        <StoreContext.Consumer
          unstable_observedBits={
            typeof getBits !== 'function'
            || observedKeys === void 0
            || observedKeys.length === 0
              ? 2147483647 // 0b1111111111111111111111111111111
              : getBits(observedKeys)
          }
        >
          {Renderer}
        </StoreContext.Consumer>
      )}
    </InternalContext.Consumer>
  )
}
