import {EndpointConsumer} from './Store'


export default Component => <EndpointConsumer children={cxt => <Component radar={cxt}/>}/>