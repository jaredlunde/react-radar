import EndpointContext from './EndpointContext'
import {observe} from './EndpointContext'


export default function EndpointConsumer ({subscribeTo, children}) {
  let observedBits = observe.none

  if (Array.isArray(subscribeTo)) {
    for (let x = 0; x < subscribeTo.length; x++) {
      observedBits |= observe[subscribeTo[x]]
    }
  }
  else if (typeof subscribeTo === 'string') {
    observedBits = observe[subscribeTo]
  }

  return <EndpointContext.Consumer
    unstable_observedBits={observedBits}
    children={children}
  />
}
