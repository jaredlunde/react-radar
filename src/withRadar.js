import React from 'react'
import {RadarConsumer} from './Store'


export default Component => <RadarConsumer children={cxt => <Component radar={cxt}/>}/>