import React from 'react'
import {objectWithoutProps, strictShallowEqual} from './utils'
import {createQueryComponent} from './Query'
import {WAITING} from './Store/Endpoint'


const withoutReload = {reload: 0}

export default createQueryComponent({
  name: 'Updater',
  prototype: {
    setup () {
      this.isRadarQuery = false
      this.state = objectWithoutProps(this.state, withoutReload)
      this.state.update = this.update.bind(this)
    },

    componentDidMount () {
      this.subscribeAll()
    },

    componentDidUpdate (_, {id}) {
      if (strictShallowEqual(id, this.state.id) === false) {
        id.forEach(
          pid =>
            this.state.id.indexOf(pid) === -1 && this.props.endpoint.unsubscribe(pid, this)
        )
      }
    },

    update () {
      let
        queries = {},
        {endpoint} = this.props,
        i = 0

      for (; i < this.state.id.length; i++) {
        const id = this.state.id[i]
        endpoint.subscribe(id, this)
        endpoint.setCached(id, {status: WAITING})
        const query = endpoint.getCached(id)
        queries[id] = {status: query.status, response: query.response}
      }

      this.setState({queries})
      return this.load()
    }
  }
})
