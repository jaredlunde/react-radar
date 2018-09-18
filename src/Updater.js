import React from 'react'
import {strictShallowEqual} from '@render-props/utils'
import {EndpointConsumer} from './Store'
import {createQueryComponent} from './Query'


export default createQueryComponent({
  name: 'Updater',
  prototype: {
    setup () {
      this.isRadarQuery = false
      this.queryContext.commit = this.reload
      delete this.queryContext.reload
    },

    componentDidMount () {},
    componentDidUpdate () {
      if (strictShallowEqual(this.getID(), this.id) === false) {
        this.unsubscribeAll()
        this.queries = this.getQueries()
      }
    }
  }
})
