import React, {useReducer, useEffect, useContext, useCallback, useRef}  from 'react'
import {useCallbackOne, useMemoOne} from 'use-memo-one'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {ServerPromisesContext} from '@react-hook/server-promises'
import {WAITING, LOADING, ERROR, DONE, getQueryID} from './Store/Endpoint'
import {EndpointContext} from './Store'
import {isNode, strictShallowEqual} from './utils'
import Connect from './Connect'
import PropTypes from 'prop-types'


const
  is = ['waiting', 'error', 'loading', 'done'],
  getAggregateStatus = queries => Math.min(...Object.values(queries).map(q => q.status)),
  getNewIds = (prevIds, nextIds) => nextIds.filter(i => prevIds.indexOf(i) === -1),
  getStaleIds = (prevIds, nextIds) => getNewIds(nextIds, prevIds),
  getID =
    queries =>
      Array.isArray(queries) === true ? queries.map(getQueryID) : [getQueryID(queries)]

const init = ({cxt, id}) => {
  let queries = {}
  for (let i = 0; i < id.current.length; i++)
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
    id.current = getID(queries)
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
        let queries = {}, i = 0
        ids = ids?.length ? ids : id.current

        for (; i < ids.length; i++) {
          let qid = ids[i]
          if (cxt.getCached(qid).status !== LOADING) {
            queries[qid] = run.current[id.current.indexOf(qid)]
            cxt.setCached(qid, {query: queries[qid], status: LOADING, response: null})
          }
        }
        // parallel means that the queries are sent separately *over the network*, but they
        // will still be added to the store synchronously
        return parallel === true
          ? Promise.all(Object.entries(queries).map(([qid, query]) => commit({[qid]: query})))
          : commit(queries)
      },
      [parallel]
    )
    // handles forceReload on mount
    if (isQuery === true)
      useEffect(
        () => {
          const reload =
            Object
              .entries(state.queries)
              .filter(([_, q]) => q.status === DONE || q.status === ERROR)
              .map(([i]) => i)

          if (forceReload === true && reload.length > 0) load(reload)
        },
        emptyArr
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
    useEffect(
      () => {
        // adds new subscriptions
        let newIds = getNewIds(prevId.current, id.current)
        newIds.forEach(i => cxt.subscribe(i, dispatch))
        // removes stale subscriptions
        getStaleIds(prevId.current, id.current).forEach(i => cxt.unsubscribe(i, dispatch))
      }
    )
    // This effect is called any time the queries object changes in the state
    useEffect(
      () => {
        // commits new ids in waiting states
        if (isQuery === true) {
          const waiting = getNewIds(prevId.current, id.current).filter(
            i => state?.queries?.[i].status === WAITING
          )
          waiting.length > 0 && load(waiting)
        }
        // loads data from the query cache into the store if this isn't the initial mount
        if (didMount.current === true)
          loadFromCache()
        didMount.current = true
        prevId.current = id.current
      },
      [state.queries]
    )
    // derives `queries` state from props, only dispatching when there is new material
    let nextQueries, unchanged = {}

    for (let i = 0; i < id.current.length; i++) {
      let qid = id.current[i], query = cxt.getCached(qid), prev = state.queries?.[qid]

      if (query === void 0)
        (nextQueries = nextQueries || {})[qid] = Object.assign(
          {},
          cxt.setCached(qid, {status: WAITING})
        )
      else if (prev?.status !== query.status || prev?.response !== query.response)
        (nextQueries = nextQueries || {})[qid] = Object.assign({}, query)
      else
        unchanged[qid] = Object.assign({}, query)
    }

    if (nextQueries !== void 0) {
      // this fetches any WAITING state queries in SSR
      if (isNode === true && isQuery === true) {
        const waiting = id.current.filter(i => state.queries[i]?.status === WAITING)

        if (waiting.length > 0) {
          waiting.forEach(i => cxt.setCached(i, {status: WAITING}))
          const promise = load(waiting)
          if (serverPromises)
            serverPromises.push(promise)
        }
      }
      dispatch(Object.assign(nextQueries, unchanged))
    }
    // unsubscribes from the endpoint on unmount
    useEffect(() => () => id.current.forEach(i => cxt.unsubscribe(i, dispatch)), emptyArr)
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
