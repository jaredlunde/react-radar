import React from 'react'
import {strictShallowEqual} from '@render-props/utils'
import {EndpointConsumer} from './Store'
import {createQueryComponent} from './Query'


export default createQueryComponent({
  name: 'Updater',
  prototype: {
    setup () {
      this.isRadarQuery = false
      this.queryContext.update = this.reload
      delete this.queryContext.reload
    },

    componentDidMount () {},
    componentDidUpdate (_, prevState) {
      if (strictShallowEqual(this.getID(), this.id) === false) {
        this.unsubscribeAll()
        this.queries = this.getQueries()
      }
    }
  }
})
