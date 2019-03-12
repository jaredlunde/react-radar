import React from 'react'


export const calculateChangedBits = stateKey => (prev, next) => {
  let prevState = prev[stateKey],
      nextState = next[stateKey],
      prevKeys =  Object.keys(prevState),
      nextKeys =  Object.keys(nextState),
      i = 0,
      changedKeys = []

  if (prevKeys.length === 0) {
    changedKeys = nextKeys
  }
  else {
    for (i; i < prevKeys.length; i++) {
      const k = prevKeys[i]
      // the previous key isn't in the current state
      if (nextState[k] === void 0) {
        changedKeys.push(k)
      }
    }

    for (i = 0; i < nextKeys.length; i++) {
      const k = nextKeys[i]

      if (// this key wasn't in the previous state
        prevState[k] === void 0
        // the previous state for this key was different than the current state
        || prevState[k] !== nextState[k]
      ) {
        changedKeys.push(k)
      }
    }
  }
  // returns the changed bits
  return next.getBits(changedKeys)
}

export const StoreInternalContext = React.createContext(null)
export const StoreContext = React.createContext({}, calculateChangedBits('data'))
export const StoreConsumer = ({children, observedKeys}) => {
  const Renderer = state => children(state.data)

  return <StoreInternalContext.Consumer
    children={
      getBits => <StoreContext.Consumer
        unstable_observedBits={
          typeof getBits !== 'function'
          || observedKeys === void 0
          || observedKeys.length === 0
            ? 1073741823 // 0b111111111111111111111111111111
            : getBits(observedKeys)
        }
        children={Renderer}
      />
    }
  />
}
