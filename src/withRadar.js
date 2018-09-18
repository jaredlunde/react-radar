import {EndpointConsumer} from './Store'


export default function withRadar (Component) {
  return <EndpointConsumer children={cxt => <Component radar={cxt}/>}/>
}
