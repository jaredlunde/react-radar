import React from 'react'
import {RadarConsumer} from './Store'


export default Component =>
    props => <RadarConsumer children={cxt => <Component radar={cxt} {...props}/>}/>