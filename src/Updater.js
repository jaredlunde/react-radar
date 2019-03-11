import React from 'react'
import {objectWithoutProps, strictShallowEqual} from './utils'
import {createQueryComponent, getID} from './Query'


const withoutReload = [{reload: 0}]

export default createQueryComponent({
  name: 'Updater',
  prototype: {
    setup () {
      this.isRadarQuery = false
      this.state.update = this.reload
      this.state = objectWithoutProps(this.state, withoutReload)
    },

    componentDidMount () {
      this.mounted = true
    },

    componentDidUpdate (_, {id}) {
      if (strictShallowEqual(id, this.state.id) === false) {
        this.unsubscribeAll()
        this.setQueries()
      }
    }
  }
})
