import React, {useReducer, useMemo, useEffect, useContext, useCallback, useRef}  from 'react'
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
  getAggregateStatus = queries => Math.min(...Object.values(queries).map(q => q.status))

export const getID = queries =>
  Array.isArray(queries) === true ? queries.map(getQueryID) : [getQueryID(queries)]

const init = ({cxt, id}) => {
  let queries = {}
  for (let i = 0; i < id.current.length; i++)
    queries[id.current[i]] = Object.assign({}, cxt.getCached(id.current[i]))

  const status = getAggregateStatus(queries)
  return {status, is: is[status], queries}
}

const reducer = (state, nextState) => {
  nextState = Object.assign({}, state, nextState)
  nextState.status = getAggregateStatus(nextState.queries)
  nextState.is = is[nextState.status]
  return nextState
}

export const createQueryComponents = (isQuery = true) => {
  let
    name = isQuery === true ? 'Query' : 'Updater',
    type = isQuery ? 'QUERY' : 'UPDATE',
    uniqueId = 0

  const useQuery = (queries, {parallel = false, async = false, forceReload = false}) => {
    const
      run = useRef(null),
      id = useRef(null),
      prevId = useRef(emptyArr),
      newIds = useRef(emptyArr),
      serverPromises = useContext(ServerPromisesContext),
      cxt = useContext(EndpointContext)
    id.current = getID(queries)
    run.current = Array.isArray(queries) === true ? queries : [queries]
    const [state, dispatch] = useReducer(reducer, {cxt, id}, init)
    // commits a set of queries ot the network phase
    const commit = useCallback(
      (queriesObject = emptyObj, fromCache = false) => {
        const queries = Object.values(queriesObject)
        return cxt[fromCache === true ? 'commitFromCache' : 'commit']({queries, type}, {async})
      },
      [async, cxt.getCached, cxt.commit, cxt.commitFromCache]
    )
    // loads a set of queries
    const load = useCallback(
      ids => {
        let queries = {}, i = 0
        ids = ids?.length ? ids : id.current

        for (; i < ids.length; i++) {
          let qid = ids[i]
          const query = cxt.subscribe(qid, dispatch)
          // this will only run queries that aren't currently in a loading, done,
          // or error state
          if (query.status !== LOADING) {
            queries[qid] = run.current[id.current.indexOf(qid)]
            cxt.setCached(qid, {query: queries[qid], status: LOADING, response: null})
          }
        }
        // parallel means that the queries are sent separately *over the network*, but they will
        // still be added to the store synchronously
        return parallel === true
          ? Promise.all(Object.entries(queries).map(([qid, query]) => commit({[qid]: query})))
          : commit(queries)
      },
      [cxt.getCached, cxt.setCached, commit, parallel]
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
        [forceReload]
      )
    // manages changes to the `id` between renders and determines the next state
    let
      isMounting = prevId.current === emptyArr,
      nextState = null,
      unchangedQueries = {},
      i = 0

    if (strictShallowEqual(id.current, prevId.current) === false) {
      nextState = {queries: {}}
      // handles stale id subscriptions
      newIds.current = id.current.filter(i => prevId.current.indexOf(i) === -1)
      prevId.current.forEach(i => id.current.indexOf(i) === -1 && cxt.unsubscribe(i, dispatch))
      prevId.current = id.current
    }

    for (; i < id.current.length; i++) {
      let
        qid = id.current[i],
        query = cxt.getCached(qid),
        prev = state.queries?.[qid]

      if (query === void 0) {
        const query = cxt.setCached(qid, {status: WAITING})
        nextState = nextState || {queries: {}}
        nextState.queries[qid] = Object.assign({}, query)
      }
      else if (
        (prev !== void 0 && isMounting === true)
        || prev?.status !== query.status
        || prev.response !== query.response
      ) {
        nextState = nextState || {queries: {}}
        nextState.queries[qid] = Object.assign({}, query)
      }
      else
        unchangedQueries[qid] = Object.assign({}, query)

      if (newIds.current.indexOf(qid) > -1)
        cxt.subscribe(qid, dispatch)
    }

    if (nextState !== null) {
      // loads any SSR queries
      if (isQuery === true) {
        const waiting = id.current.filter(i => !nextState.queries[i]?.status)
        if (isNode === true && waiting.length > 0) {
          const promise = load(waiting)
          if (serverPromises)
            serverPromises.push(promise)
        }
      }
      // creates the full queries object
      Object.assign(nextState.queries, unchangedQueries)
      // dispatches the next state
      dispatch(nextState)
    }
    // handles cleanup on unmount
    useEffect(
      () => {
        // loads from cache
        if (isNode === false && newIds.current.length > 0) {
          let
            cached = Object.entries(state.queries).filter(
              ([i, q]) => newIds.current.indexOf(i) > -1 && q.status === DONE
            ),
            fromCache = cached.reduce(
              (qs, [i]) => Object.assign(qs, {[i]: run.current[id.current.indexOf(i)]}),
              {}
            )

          if (cached.length > 0)
            commit(fromCache, true)
        }

        if (isQuery === true) {
          const waiting = id.current.filter(i => state.queries[i].status === WAITING)
          console.log('WAITING')
          waiting.length > 0 && load(waiting)
        }
      },
      [state.queries]
    )
    useEffect(() => id.current.forEach(i => cxt.subscribe(i, dispatch)))
    useEffect(() => () => id.current.forEach(i => cxt.unsubscribe(i, dispatch)), emptyArr)

    return useMemo(
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
