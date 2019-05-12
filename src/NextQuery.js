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

  for (let i = 0; i < id.length; i++)
    queries[id[i]] = Object.assign({}, cxt.getCached(id[i]))

  const status = getAggregateStatus(queries)
  return {id, status, is: is[status], queries}
}

const reducer = (state, nextState) => {
  nextState = Object.assign({}, state, nextState)
  nextState.status = getAggregateStatus(nextState.queries)
  nextState.is = is[nextState.status]
  return nextState
}

export const createQueryComponents = (isQuery = true) => {
  let
    uniqueId = 0,
    name = isQuery === true ? 'Query' : 'Updater',
    type = isQuery ? 'QUERY' : 'UPDATE'

  const useQuery = (run, {parallel = false, async = false, forceReload = false}) => {
    run = Array.isArray(run) === true ? run : [run]
    const
      id = getID(run),
      prevId = useRef(emptyArr),
      componentId = useRef(null),
      serverPromises = useContext(ServerPromisesContext),
      cxt = useContext(EndpointContext),
      [state, dispatch] = useReducer(reducer, {cxt, id}, init)
    // sets a unique component id for tracking listener counts in the parent endpoint
    if (componentId.current === null) componentId.current = uniqueId++
    // handles cleanup on unmount
    const unsubscribeAll = useCallback(
      () => id.forEach(i => cxt.unsubscribe(i, componentId.current)),
      id.concat([cxt.unsubscribe])
    )
    useEffect(() => unsubscribeAll, emptyArr)
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
        ids = ids?.length ? ids : id

        for (; i < ids.length; i++) {
          let qid = ids[i]
          // this will only run queries that aren't currently in a loading, done,
          // or error state
          if (cxt.getCached(qid).status !== LOADING) {
            queries[qid] = run[id.indexOf(qid)]
            cxt.setCached(qid, {query: queries[qid], status: LOADING, response: null})
          }
        }
        // parallel means that the queries are sent separately *over the network*, but they will
        // still be added to the store synchronously
        return parallel === true
          ? Promise.all(Object.entries(queries).map(([qid, query]) => commit({[qid]: query})))
          : commit(queries)
      },
      id.concat([cxt.getCached, cxt.setCached, commit, parallel])
    )
    // handles forceReload on mount
    if (isQuery === true)
      useEffect(
        () => {
          const
            statuses = Object.values(state.queries).map(q => q.status),
            anyDone = statuses.some(s => s === DONE)

          if (anyDone === true && forceReload === true)
            load(
              Object
                .entries(state.queries)
                .filter(([_, q]) => q.status === DONE || q.status === ERROR)
                .map(([i]) => i)
            )
        },
        emptyArr
      )
    // manages changes to the `id` between renders and determines the next state
    let isMounting = prevId.current === emptyArr, nextState = null, unchangedQueries = {}, i = 0

    if (strictShallowEqual(id, prevId.current) === false) {
      nextState = {id, queries: {}}
      // handles stale id subscriptions
      prevId.current.forEach(i => id.indexOf(i) === -1 && cxt.unsubscribe(i, componentId.current))
      prevId.current = id
    }

    for (; i < id.length; i++) {
      let
        qid = id[i],
        query = cxt.getCached(qid),
        prev = state.queries?.[qid]

      cxt.subscribe(qid, componentId.current)

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
    }

    if (nextState !== null) {
      // loads any SSR queries
      const waiting = id.filter(i => nextState.queries[i]?.status === WAITING)

      if (waiting.length > 0 && isQuery === true) {
        const promise = load(waiting)
        if (isNode === true && serverPromises)
          serverPromises.push(promise)
      }
      // creates the full queries object
      Object.assign(nextState.queries, unchangedQueries)
      // loads from cache
      if (isNode === false && isMounting === true) {
        let
          cached = Object.entries(nextState.queries).filter(([_, q]) => q.status === DONE),
          fromCache = cached.reduce(
            (qs, [i]) => Object.assign({}, qs, {[i]: run[id.indexOf(i)]}),
            {}
          )

        if (cached.length > 0)
          commit(fromCache, true)
      }
      // dispatches the next state
      dispatch(nextState)
    }

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
