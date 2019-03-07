import React from 'react'
import PropTypes from 'prop-types'
import Promise from 'cancelable-promise'
import {isNode} from '../../utils'
import EndpointContext from './EndpointContext'
import createCache from './createCache'


/**
 * The Endpoint component is the glue that binds together the Networking layer,
 * Props, the Store and Context.
 * @extends React.Component
 */
class Endpoint extends React.Component {
  mounted = false

  static propTypes = {
    cache: PropTypes.object,
    initialState: PropTypes.object,
    state: PropTypes.object,
    updateState: PropTypes.func.isRequired,
    post: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.endpointContext = {
      queryCache: props.cache || createCache(),
      // local 'optimistic' updates, does not send commit over the network
      commitLocal: this.commitLocal,
      // remote + optimistic updates - commits to the network
      commit: this.commit
    }
  }

  commit = (opt, context) => {
    const optimistic = isNode === false && this.commitLocal(opt)
    let {type, queries} = opt
    const payload = []

    for (let query of queries) {
      const requires = {}

      for (let key in query.requires) {
        requires[key] = query.requires[key].requiresFields
      }

      payload.push({name: query.name, props: query.props, requires})
    }

    // makes the commit 'cancelable'
    return new Promise(
      async resolve => {
        let state
        let [{response, nextState}] = await Promise.all(
          [this.commitPayload(payload, context), optimistic]
        )

        switch (response.status) {
          case   0:
          case 200:
          break;
          default:
            // execute rollbacks on the failed mutations
            const rollbacks = [], rollbackQueries = []

            for (let query of queries) {
              if (typeof query.rollback === 'function') {
                // optimistic updates can rollback on errors
                rollbacks.push(query.rollback(query.props, this.props.state, query.requires))
                rollbackQueries.push(query)
              }
            }

            if (rollbacks.length > 0) {
              nextState = rollbacks
              queries = rollbackQueries
              type = `ROLLBACK_${type.toUpperCase()}`
            }
        }

        state = isNode === false && await this.props.updateState({
          nextState,
          queries,
          response,
          type
        })

        this.props.cache.initialState = state
        resolve({state, response})
      }
    )
  }

  async commitPayload (payload, context) {
    // posts the JSON request
    const response = await this.props.post(payload, context)
    return {response, nextState: response.json}
  }

  commitLocal = opt /*{type, queries}*/=> {
    const optimisticUpdates = [], optimisticQueries = []

    for (let query of opt.queries) {
      if (typeof query.optimistic === 'function') {
        optimisticUpdates.push(query.optimistic(query.props, this.props.state, query.requires))
        optimisticQueries.push(query)
      }
    }

    if (optimisticUpdates.length > 0) {
      const state = this.props.updateState({
        nextState: optimisticUpdates,
        queries: optimisticQueries,
        type: `OPTIMISTIC_${opt.type.toUpperCase()}`
      })

      this.props.cache.initialState = state
      return state
    }

    return Promise.resolve(this.props.cache.initialState || null)
  }

  render () {
    return (
      <EndpointContext.Provider value={this.endpointContext}>
        {React.Children.only(this.props.children)}
      </EndpointContext.Provider>
    )
  }
}

export default function NetworkEndpoint (props) {
  // Networking layer
  return props.network(context => <Endpoint {...context} {...props}/>)
}
