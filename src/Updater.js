import React from 'react'
import {strictShallowEqual} from '@render-props/utils'
import {objectWithoutProps} from './utils'
import {createQueryComponent} from './Query'


const withoutReload = [{reload: 0}]

export default createQueryComponent({
  name: 'Updater',
  prototype: {
    setup () {
      this.isRadarQuery = false
      this.queryContext.update = this.reload
      this.queryContext = objectWithoutProps(this.queryContext, withoutReload)
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
