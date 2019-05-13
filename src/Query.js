import React, {useReducer, useEffect, useContext, useRef}  from 'react'
import {useCallbackOne, useMemoOne} from 'use-memo-one'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {ServerPromisesContext} from '@react-hook/server-promises'
import {WAITING, LOADING, ERROR, DONE, getQueryId} from './Store/Endpoint'
import {EndpointContext} from './Store'
import {isNode} from './utils'
import Connect from './Connect'
import PropTypes from 'prop-types'


const
  is = ['waiting', 'error', 'loading', 'done'],
  getAggregateStatus = queries => Math.min(...Object.values(queries).map(q => q.status)),
  getNewIds = (prevIds, nextIds) => nextIds.filter(id => prevIds.indexOf(id) === -1),
  getStaleIds = (prevIds, nextIds) => getNewIds(nextIds, prevIds),
  getId =
    queries =>
      Array.isArray(queries) === true ? queries.map(getQueryId) : [getQueryId(queries)]

const init = ({cxt, id}) => {
  let queries = {}, i = 0
  for (; i < id.current.length; i++)
    queries[id.current[i]] = Object.assign({status: WAITING}, cxt.getCached(id.current[i]))
  const status = getAggregateStatus(queries)
  return {status, is: is[status], queries}
}

const reducer = (state, queries) => {
  const status = getAggregateStatus(queries)
  return {queries, status, id: is[status]}
}

export const createQueryComponents = (isQuery = true) => {
  let
    name = isQuery === true ? 'Query' : 'Updater',
    type = isQuery ? 'QUERY' : 'UPDATE'

  const useQuery = (queries, {parallel = false, async = false, forceReload = false}) => {
    const
      run = useRef(null),
      id = useRef(null),
      prevId = useRef(emptyArr),
      didMount = useRef(false),
      serverPromises = useContext(ServerPromisesContext),
      cxt = useContext(EndpointContext)
    id.current = getId(queries)
    run.current = Array.isArray(queries) === true ? queries : [queries]
    const [state, dispatch] = useReducer(reducer, {cxt, id}, init)
    // commits a set of queries ot the network phase
    const commit = useCallbackOne(
      (queriesObject = emptyObj) => cxt.commit(
        {queries: Object.values(queriesObject), type},
        {async}
      ),
      [async]
    )
    // commmits a set of queries from the query cache
    const commitFromCache = useCallbackOne(
      (queriesObject = emptyObj) => cxt.commitFromCache(
        {queries: Object.values(queriesObject), type},
        {async}
      ),
      [async]
    )
    // loads a set of queries
    const load = useCallbackOne(
      ids => {
        let queries = {};
        (ids?.length ? ids : id.current)
          .filter(queryId => cxt.getCached(queryId).status !== LOADING)
          .forEach(queryId => {
            queries[queryId] = run.current[id.current.indexOf(queryId)]
            cxt.setCached(queryId, {query: queries[queryId], status: LOADING})
          })
        // parallel means that the queries are sent separately *over the network*, but they
        // will still be added to the store synchronously
        return parallel === true
          ? Promise.all(
              Object.entries(queries).map(([queryId, query]) => commit({[queryId]: query}))
            )
          : commit(queries)
      },
      [parallel]
    )
    // reads any cached queries and commits them to the store
    const loadFromCache = useCallbackOne(
      () => {
        let
          newIds = getNewIds(prevId.current, id.current),
          cached = Object.entries(state.queries).filter(
            ([i, q]) => newIds.indexOf(i) > -1 && q.status === DONE
          )

        if (cached.length > 0)
          commitFromCache(
            cached.reduce(
              (qs, [i]) => Object.assign(qs, {[i]: run.current[id.current.indexOf(i)]}),
              {}
            )
          )
      },
      emptyArr
    )
    // This is here to prevent a flash during SSR rehydration. When loadFromCache() is only
    // called in useEffect(), there is a very grotesque flash that happens while the data
    // is pending its commit to the store. When it is done during this initial render phase,
    // it doesn't happen.
    useMemoOne(loadFromCache, emptyArr)
    // this effect unsubscribes from stale queries each update and subscribes to new ones
    useEffect(
      () => {
        // adds new subscriptions
        getNewIds(prevId.current, id.current).forEach(queryId => cxt.subscribe(queryId))
        // removes stale subscriptions
        getStaleIds(prevId.current, id.current).forEach(queryId => cxt.unsubscribe(queryId))
      }
    )
    // this effect is called any time the queries object changes in the state
    useEffect(
      () => {
        // commits new ids in waiting states
        if (isQuery === true) {
          const waiting = getNewIds(prevId.current, id.current).filter(
            queryId => state?.queries?.[queryId].status === WAITING
          )
          waiting.length > 0 && load(waiting)
        }
        // loads data from the query cache into the store if this isn't the initial mount
        if (didMount.current === true)
          loadFromCache()

        didMount.current = true
        // updates the prevId each time state.queries changes
        prevId.current = id.current
      },
      [state.queries]
    )
    // handles forceReload on mount
    if (isQuery === true)
      useEffect(
        () => {
          if (forceReload === true) {
            const reload =
              Object
                .entries(state.queries)
                .filter(([_, q]) => q.status === DONE || q.status === ERROR)
                .map(([i]) => i)

            if (reload.length > 0) load(reload)
          }
        },
        emptyArr
      )
    // derives `queries` state from props, only dispatching when there is new material
    let nextQueries, unchanged = {}, i = 0

    for (; i < id.current.length; i++) {
      let
        queryId = id.current[i],
        query = cxt.getCached(queryId),
        prev = state.queries?.[queryId]

      if (query === void 0)
        (nextQueries = nextQueries || {})[queryId] = Object.assign(
          {},
          cxt.setCached(queryId, {status: WAITING})
        )
      else if (prev?.status !== query.status || prev?.response !== query.response)
        (nextQueries = nextQueries || {})[queryId] = Object.assign({}, query)
      else
        unchanged[queryId] = Object.assign({}, query)
    }

    if (nextQueries !== void 0) {
      nextQueries = Object.assign(nextQueries, unchanged)
      // this fetches any WAITING state queries in SSR
      if (isNode === true && isQuery === true) {
        const waiting = id.current.filter(queryId => nextQueries[queryId]?.status === WAITING)

        if (waiting.length > 0) {
          waiting.forEach(queryId => cxt.setCached(queryId, {status: WAITING}))
          const promise = load(waiting)
          if (serverPromises)
            serverPromises.push(promise)
        }
      }
      // sets the new queries and status in local state
      dispatch(nextQueries)
    }
    // unsubscribes from the endpoint on unmount
    useEffect(() => () => id.current.forEach(queryId => cxt.unsubscribe(queryId)), emptyArr)
    // returns the query context object
    return useMemoOne(
      () => Object.assign({}, state, {[isQuery === true ? 'reload' : 'update']: load}),
      [load, state]
    )
  }

  const Query = ({connect, children, run, ...props}) => {
    const query = useQuery(run, props)
    return connect
      ? Connect({to: connect, children: state => children(state, query)})
      : children(query)
  }

  if (__DEV__) {
    Query.displayName = name

    const queryShape = PropTypes.shape({
      name: PropTypes.string.isRequired,
      local: PropTypes.bool,
      requires: PropTypes.object,
      optimistic: PropTypes.func,
      rollback: PropTypes.func,
      params: PropTypes.object.isRequired,
      input: PropTypes.object.isRequired,
      reducer: PropTypes.func.isRequired,
      isRecordUpdate: PropTypes.bool.isRequired
    })

    Query.propTypes = {
      connect: PropTypes.string,
      run: PropTypes.oneOfType([PropTypes.arrayOf(queryShape), queryShape]).isRequired,
      parallel: PropTypes.bool,
      async: PropTypes.bool,
      forceReload: PropTypes.bool
    }
  }

  Query.WAITING = WAITING
  Query.ERROR = ERROR
  Query.LOADING = LOADING
  Query.DONE = DONE
  return [useQuery, Query]
}

const [useQuery, Query] = createQueryComponents()
export {Query, useQuery}
