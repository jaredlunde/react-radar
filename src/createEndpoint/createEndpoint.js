import React from 'react'
import PropTypes from 'prop-types'
import isEqual from 'fast-deep-equal'
import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
import InternalContext from '../Store/InternalContext'
import Props from './Props'
import EndpointProvider from './EndpointProvider'
import createNetworking from '../createNetworking'
import defaultReducer from './defaultReducer'
import {getQueryRequestPayload} from './utils'
import {invariant} from '../utils'


export const STATUS = {
  LOADING_QUERIES: 'loadingQueries',
  LOADING_STATE: 'loadingState',
  DONE: 'done',
  FAILED: 'failed'
}


/**
 * The Endpoint component is the glue that binds together the Networking layer,
 * Props, the Store and Context.
 * @extends React.Component
 */
class Endpoint extends React.Component {
  // Each endpoint gets its own 'state' instance, but the RecordMap is ubiquitous
  static propTypes = {
    name: PropTypes.string.isRequired,
    initialState: PropTypes.object,
    reducer: PropTypes.func.isRequired,
    queryProps: PropTypes.object,
    setProps: PropTypes.func,
    send: PropTypes.func.isRequired,
    abort: PropTypes.func.isRequired,
    setStore: PropTypes.func.isRequired,
    setRecords: PropTypes.func.isRequired,
  }

  isRadarEndpoint = true

  constructor (props) {
    super(props)
    this.cancelable = []
    props.registerEndpoint(this)

    // sets the initial state
    if (props.queries && !props.initialState) {
      // if there were queries, but no initial state, prepare the endpoint
      // to load next state
      this.state = {
        status: STATUS.LOADING_QUERIES,
        response: emptyObj
      }

      // only process queries if there were queries to process
      if (props.queries.length > 0) {
        this.makeCancelable(this.processQueries(props))
      }
    }
    else {
      // there was initial state or there were no queries
      this.state = {
        // we are done in this case
        status: (
          props.initialState && props.initialState.radarStatus
          ? props.initialState.radarStatus
          : STATUS.DONE
        ),
        // if there was an initial state, grab the response object from that
        // otherwise set an empty object
        response: props.initialState ? props.initialState.response : emptyObj
      }
    }

    this.endpointContext = {
      update: this.update,
      willUpdate: this.willUpdate,
      commit: this.commit,
      willCommit: this.willCommit,
      refresh: this.refresh,
      setProps: this.props.setProps,
      queryProps: this.props.queryProps,
      endpoint: this.state,
    }
  }

  componentDidUpdate ({queryProps, queries, ...nextProps}) {
    // Refreshes the store when teh query properties change
    if (
      queries
      && queries.length > 0
      && isEqual(this.props.queryProps, queryProps) === false
    ) {
      this.refresh()
    }
  }

  componentWillUnmount () {
    this.props.abort()

    while (this.cancelable.length > 0) {
      this.cancelable.pop().cancel()
    }

    this.props.unregisterEndpoint(this)
  }

  makeCancelable (promise) {
    // wraps normal promises (like those from 'await') with cancelable promises
    const wrapper = new Promise(
      (resolve, reject) => {
        promise.then(resolve).catch(reject)
        this.cancelable.splice(this.cancelable.indexOf(wrapper), 1)
      }
    )

    this.cancelable.push(wrapper)
    return wrapper
  }

  async processQueries (props) {
    const {setStore, queries, queryProps, send, reducer} = props || this.props
    const payload = getQueryRequestPayload(queries, queryProps)

    // bail out if there was no payload
    if (payload === null) {
      return
    }

    const response = await send(payload)
    // sets state w/ new response and latest load status
    switch (response.status) {
      case   0:
      case 200:
        this.setState({status: STATUS.LOADING_STATE, response})
        break;
      default:
        this.setState({status: STATUS.FAILED, response})
        return {response}
    }
    // updates the store w/ the newly received data
    const nextState = await response.json()
    await setStore({
      reducer,
      nextState,
      response,
      queries,
      queryProps,
      type: 'QUERY'
    })
    // sets the local state to done and resolves w/ the query response
    this.setState({status: STATUS.DONE})
    return {response}
  }

  async commitPayload ({payload, optimisticResult}) {
    // sends the JSON request
    const response = await this.props.send(payload)

    // waits for optimistic updates to be applied before committing the query ones
    if (optimisticResult !== void 0) {
      await optimisticResult
    }

    const nextState = await response.json()
    // updates the store w/ the newly received data
    return {response, nextState}
  }

  commitOptimisticAction ({
    optimisticUpdates,
    optimisticQueries,
    queryProps,
    reducer,
    ...context
  }) {
    // commits optimistic actions to the store
    return this.props.setStore({
      nextState: optimisticUpdates,
      queries: optimisticQueries,
      queryProps,
      reducer,
      ...context,
      type: 'OPTIMISTIC_ACTION'
    })
  }

  async commitAction ({
    rollbacks,
    rollbackQueries,
    optimisticUpdates,
    optimisticQueries,
    queryProps,
    queries,
    payload,
    reducer
  }) {
    const {setStore} = this.props
    // if there were optimistic updates, commit them to the store right away
    let optimisticResult
    if (optimisticUpdates.length > 0) {
      optimisticResult = this.commitOptimisticAction({
        optimisticUpdates,
        optimisticQueries,
        queryProps,
        reducer,
        radar: this
      })
    }
    // sends the JSON request
    let {nextState, response} = await this.commitPayload({payload, optimisticResult})
    // raises exception if the response status is not OK
    switch (response.status) {
      case   0:
      case 200:
        break;
      default:
        // execute rollbacks on the failed actions
        if (rollbacks.length > 0) {
          nextState = rollbacks
          await setStore({
            reducer,
            nextState,
            queries: rollbackQueries,
            queryProps,
            radar: this,
            type: 'OPTIMISTIC_ACTION_ROLLBACK'
          })
        }

        return {response, status: STATUS.FAILED, nextState}
    }
    // updates the store w/ the newly received data
    nextState = await setStore({
      reducer,
      nextState,
      response,
      queries,
      queryProps,
      radar: this,
      type: 'ACTION'
    })
    // resolves with the action response
    return {response, status: STATUS.DONE, nextState}
  }

  commitOptimisticRecordMutation ({
    optimisticUpdates,
    optimisticQueries,
    queryProps,
    reducer,
    ...context
  }) {
    return this.props.setRecords({
      nextState: optimisticUpdates,
      queries: optimisticQueries,
      queryProps,
      reducer,
      ...context,
      type: 'OPTIMISTIC_RECORD_MUTATION'
    })
  }

  async commitRecordMutation ({
    rollbacks,
    rollbackQueries,
    optimisticUpdates,
    optimisticQueries,
    queryProps,
    queries,
    payload,
    reducer
  }) {
    const {setRecords} = this.props
    // if there were optimistic updates, commit them to the store right away
    let optimisticResult
    if (optimisticUpdates.length > 0) {
      optimisticResult = this.commitOptimisticRecordMutation({
        optimisticUpdates,
        optimisticQueries,
        queryProps,
        reducer,
        radar: this,
      })
    }
    // sends the JSON request
    let {nextState, response} = await this.commitPayload({payload, optimisticResult})

    // raises exception if the response status is not OK
    switch (response.status) {
      case   0:
      case 200:
        break;
      default:
        // execute rollbacks on the failed mutations
        if (rollbacks.length > 0) {
          nextState = rollbacks
          await setRecords({
            nextState,
            queries: rollbackQueries,
            queryProps,
            reducer,
            radar: this,
            type: 'OPTIMISTIC_RECORD_MUTATION_ROLLBACK'
          })
        }

        return {response, status: STATUS.FAILED, nextState}
    }
    // updates the store w/ the newly received data
    nextState = await setRecords({
      nextState,
      response,
      queries,
      queryProps,
      reducer,
      radar: this,
      type: 'RECORD_MUTATION'
    })
    // resolves with the action response
    return {response, status: STATUS.DONE, nextState}
  }

  commit = ({queryProps, queries, isRadarAction, ...props}) => {
    // gets the request payload for the query
    const payload = getQueryRequestPayload(queries, queryProps)
    // gets any optimstic results from the queries
    const optimisticUpdates = [],
          optimisticQueries = [],
          rollbacks = [],
          rollbackQueries = []

    for (let x in payload) {
      const query = payload[x]
      if (query.optimistic) {
        optimisticUpdates.push(query.optimistic)
        optimisticQueries.push(queries[x])
      }
      if (query.rollback) {
        // optimistic updates can rollback on errors
        rollbacks.push(query.rollback)
        rollbackQueries.push(queries[x])
      }
    }
    // props shared between record mutations and actions
    const commitProps = {
      rollbacks,
      rollbackQueries,
      optimisticQueries,
      optimisticUpdates,
      queryProps,
      queries,
      payload,
      ...props
    }
    // routes the commit according to its type (record mutation or action)
    return (
      isRadarAction
      ? this.makeCancelable(this.commitAction(commitProps))
      : this.makeCancelable(this.commitRecordMutation(commitProps))
    )
  }

  // returns a function containing the commit for the action. useful
  // in situations where you want to commit an action, say, onClick,
  // onClick={radar.willCommit(SomeAction({foo}))}
  willCommit = action => () => this.commit(action)

  update = action => {
    const {queries, queryProps, reducer, isRadarAction, ...props} = action
    // finds only optimistic (local) updates
    const optimisticUpdates = []
    const optimisticQueries = []
    for (let x = 0; x < queries.length; x++) {
      const query = queries[x](queryProps)
      if (query.optimistic) {
        optimisticUpdates.push(query.optimistic)
        optimisticQueries.push(queries[x])
      }
    }
    // commits either the optimistic action or record mutation
    const options = {optimisticUpdates, optimisticQueries, queryProps, reducer}
    const update = (
      isRadarAction
      ? this.commitOptimisticAction(options)
      : this.commitOptimisticRecordMutation(options)
    )
    // you can later commit actions to the network via the commit key in
    // this object. this object also acts like a promise by inheriting
    // 'then' and 'catch' from update
    return {
      commit: () => this.commit(action),
      then: update.then.bind(update),
      catch: update.catch.bind(update)
    }
  }

  willUpdate = action => () => this.update(action)

  refresh = () => {
    // reloads the endpoint's queries
    this.setState({status: STATUS.LOADING_QUERIES})
    return this.makeCancelable(this.processQueries())
  }

  render () {
    let context = this.endpointContext

    if (
      context.endpoint.status !== this.state.status
      || context.queryProps !== this.props.queryProps
    ) {
      context = {...this.endpointContext}
      context.endpoint = this.state
      context.queryProps = this.props.queryProps
      this.endpointContext = context
    }

    return (
      <EndpointProvider value={context}>
        {this.props.children(context)}
      </EndpointProvider>
    )
  }
}

/** opt: {name, fetch, defaultProps, queries, reducer} */
export default function createEndpoint (opt) {
  if (__DEV__) {
    invariant(
      opt.name,
      'Radar Endpoints must be created with a name.'
    )
  }

  const Networking = createNetworking({name: opt.name})

  function RadarProvider (props) {
    // Networking layer
    return Networking({
      fetch: opt.fetch,
      children: networkingContext => (
        <Props defaultProps={opt.defaultProps} {...props}>
          {propsContext => (
            <InternalContext.Consumer>
              {providerContext => (
                <Endpoint
                  name={opt.name}
                  queries={opt.queries}
                  reducer={opt.reducer}
                  {...networkingContext}
                  {...propsContext}
                  {...providerContext}
                >
                  {props.children}
                </Endpoint>
              )}
            </InternalContext.Consumer>
          )}
        </Props>
      )
    })
  }

  RadarProvider.meta = opt
  return RadarProvider
}
