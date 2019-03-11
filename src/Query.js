import React from 'react'
import PropTypes from 'prop-types'
import {strictShallowEqual} from '@render-props/utils'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import Connect from './Connect'
import {WAITING, LOADING, ERROR, DONE, getQueryID} from './Store/Endpoint/Endpoint'
import {EndpointConsumer} from './Store'
import {isNode} from './utils'


const is = ['waiting', 'error', 'loading', 'done']
const getAggregateStatus = queries => Math.min(...Object.values(queries).map(q => q.status))
export const getID = queries =>
  Array.isArray(queries) ? queries.map(getQueryID) : [getQueryID(queries)]

const queryShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  requires: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  optimistic: PropTypes.func,
  rollback: PropTypes.func,
  props: PropTypes.object.isRequired,
  reducer: PropTypes.func.isRequired,
  isRecordUpdate: PropTypes.bool.isRequired
})

export function createQueryComponent (opt = emptyObj) {
  let {name = 'Query', prototype = emptyObj} = opt

  class Query extends React.Component {
    id = null

    static propTypes = {
      endpoint: PropTypes.shape({
        commitLocal: PropTypes.func.isRequired,
        commit: PropTypes.func.isRequired
      }),
      connect: PropTypes.string,
      run: PropTypes.oneOfType([
        PropTypes.arrayOf(queryShape),
        queryShape
      ]).isRequired,
      parallel: PropTypes.bool,
      forceReload: PropTypes.bool
    }

    constructor (props) {
      super(props)
      this.state = {
        id: getID(props.run),
        status: LOADING,
        is: 'loading',
        reload: this.reload,
        queries: {}
      }
      // binds the queries in run to this
      this.setQueries()
      // this must be before the query loop because it defines 'isRadarQuery' in Updater
      this.isRadarQuery = true
      this.setup && this.setup()
      const {endpoint} = props

      for (let id in this.queries) {
        const query = endpoint.getCached(id)
        const status = query === void 0 ? WAITING : query.status

        if (query !== void 0) {
          query.query = query.query || this.queries[id]
        }
        else if (
          // this checks to see if we're in a Node (SSR) environment
          isNode === true
          // makes sure this is a Query, not an update
          && this.isRadarQuery
          && endpoint.promises !== void 0
        ) {
          endpoint.promises.push(this.load())
        }

        this.state.queries[id] = {
          status,
          response: query ? query.response : null
        }
      }

      this.state.status = getAggregateStatus(this.state.queries)
      this.state.is = is[this.state.status]
    }

    static getDerivedStateFromProps (props, state) {
      let nextID = getID(props.run),
          nextState = null

      if (strictShallowEqual(nextID, state.id) === false) {
        nextState = {id: nextID}
      }

      for (let id of nextID) {
        const query = props.endpoint.queries[id]
        const stateQuery = state.queries[id]

        if (
          query !== void 0
          && (
            stateQuery === void 0
            || stateQuery.status !== query.status
            || stateQuery.response !== query.response
            || nextState !== null
          )
        ) {
          nextState = nextState || {...state}
          nextState.queries = nextState.queries || {}
          nextState.queries[id] = {
            status: query.status,
            response: query.response
          }
        }
      }

      if (nextState !== null && nextState.queries !== void 0) {
        nextState.status = getAggregateStatus(nextState.queries)
        nextState.is = is[nextState.status]
      }

      return nextState
    }

    componentDidMount () {
      const statuses = Object.values(this.state.queries).map(q => q.status)
      const anyDone = statuses.some(s => s === DONE)

      if (anyDone === true && this.props.forceReload === true) {
        this.reload()
      }
      else if (anyDone === false || statuses.some(s => s !== DONE && s !== LOADING) === true) {
        this.load()
      }
    }

    componentDidUpdate (_, {id}) {
      if (strictShallowEqual(id || emptyArr, this.state.id) === false) {
        this.unsubscribeAll()
        this.setQueries()
        this.load()
      }
    }

    componentWillUnmount () {
      this.unsubscribeAll()
    }

    unsubscribeAll () {
      this.state.id.forEach(id => this.props.endpoint.unsubscribe(id, this))
    }

    setQueries () {
      const queries = {}
      const run = this.props.run

      if (Array.isArray(run)) {
        for (let i = 0; i < this.state.id.length; i++) {
          queries[this.state.id[i]] = run[i]
        }
      }
      else {
        queries[this.state.id[0]] = run
      }

      this.queries = queries
    }

    load = () => {
      let {endpoint} = this.props
      const queries = {}

      for (let id in this.queries) {
        const query = endpoint.getCached(id)
        endpoint.subscribe(id, this)

        if (query === void 0 || query.status === WAITING) {
          queries[id] = this.queries[id]
          endpoint.setCached(
            id,
            {query: queries[id], status: LOADING, response: null}
          )
        }
      }

      return this.props.parallel === true
        ? Promise.all(Object.keys(queries).map(id => this.commit({[id]: queries[id]})))
        : this.commit(queries)
    }

    commit (queriesObject = emptyObj) {
      const queries = Object.values(queriesObject)
      const {endpoint} = this.props
      return queries.length > 0
        ? endpoint.commit({queries, type: this.isRadarQuery ? 'QUERY' : 'UPDATE'})
        : Promise.all(Object.keys(this.queries).map(id => endpoint.getCached(id).commit))
    }

    reload = (ids = emptyArr) => {
      ids = ids.length > 0 && typeof ids[0] === 'string' ? ids : this.state.id
      ids.forEach(id => this.props.endpoint.setCached(id, {status: WAITING}))
      this.setQueries()
      return this.load()
    }

    render () {
      return this.props.connections === void 0
        ? this.props.children(this.state)
        : this.props.children(this.props.connections, this.state)
    }
  }

  if (__DEV__) {
    Query.displayName = name
  }

  for (let key in prototype) {
    Query.prototype[key] = prototype[key]
  }

  function withEndpoint (Component) {
    const componentWithEndpoint = props => (
      props.connect
        ? Connect({
            to: props.connect,
            __internal: true,
            __internal_observedKeys: getID(props.run),
            children: (connections, endpoint) =>
              <Component endpoint={endpoint} connections={connections} {...props}/>
          })
        : <EndpointConsumer
            observedKeys={getID(props.run)}
            children={endpoint => <Component endpoint={endpoint} {...props}/>}
          />
    )

    componentWithEndpoint.WAITING = WAITING
    componentWithEndpoint.ERROR = ERROR
    componentWithEndpoint.LOADING = LOADING
    componentWithEndpoint.DONE = DONE

    if (__DEV__) {
      componentWithEndpoint.displayName = `withEndpoint(${Component.name})`
    }

    return componentWithEndpoint
  }

  return withEndpoint(Query)
}

export default createQueryComponent()
