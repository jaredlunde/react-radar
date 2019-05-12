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

const init = id => ({id, status: WAITING, is: 'loading'})
const reducer = (state, nextState) => {
  nextState = Object.assign({}, state, nextState)
  nextState.status = nextState.queries ? getAggregateStatus(nextState.queries) : WAITING
  nextState.is = is[nextState.status]
  return nextState
}

export const createQueryComponents = (isQuery = true) => {
  let
    uniqId = 0,
    name = isQuery === true ? 'Query' : 'Updater',
    type = isQuery ? 'QUERY' : 'UPDATE'

  const useQuery = (run, {parallel = false, async = false, forceReload = false}) => {
    run = Array.isArray(run) === true ? run : [run]
    const
      componentId = useRef(null),
      ssrContext = useContext(ServerPromisesContext),
      cxt = useContext(EndpointContext),
      id = getID(run),
      prevId = useRef(emptyArr),
      [state, dispatch] = useReducer(reducer, id, init)

    if (componentId.current === null) componentId.current = uniqId++

    const commit = useCallback(
      (queriesObject = emptyObj, fromCache = false) => {
        const queries = Object.values(queriesObject)
        return cxt[fromCache === true ? 'commitFromCache' : 'commit']({queries, type}, {async})
      },
      [async, cxt.getCached, cxt.commit, cxt.commitFromCache]
    )

    const load = useCallback(
      ids => {
        let queries = {}, inProgress = [], i = 0

        for (; i < ids.length; i++) {
          let id = ids[i], query = cxt.getCached(id)
          // this will only run queries that aren't currently in a loading, done,
          // or error state
          console.log('hmmm...', query)
          if (query.status === void 0 || query.status === WAITING) {
            queries[id] = run[i]
            cxt.setCached(id, {query: queries[id], status: LOADING, response: null})
          }
          else
            inProgress.push(query.commit)
        }
        // parallel means that the queries are sent separately *over the network*, but they will
        // still be added to the store synchronously
        if (inProgress.length === ids.length)
          return Promise.all(inProgress)
        else
          return parallel === true
            ? Promise.all(Object.keys(queries).map(id => commit({[id]: queries[id]})))
            : commit(queries)
      },
      [cxt, commit, parallel]
    )

    const reload = useCallback(
      (ids = emptyArr) => {
        ids = ids.length > 0 ? ids : id
        ids.forEach(id => {
          const query = cxt.getCached(id)
          if (query !== void 0 && query.status !== LOADING)
            cxt.setCached(id, {status: WAITING})
        })
        return load(ids)
      },
      id.concat([cxt])
    )
    /*
    useEffect(
      () => {
        const
          statuses = Object.values(state.queries).map(q => q.status),
          anyDone = statuses.some(s => s === DONE)

        if (anyDone === true && forceReload === true)
          reload()
        else if (anyDone === false || statuses.some(s => s !== DONE && s !== LOADING) === true)
          load()
        else {
          id.forEach(id => cxt.unsubscribe(id, componentId.current))
          let queries = {}, i = 0

          for (; i < id.length; i++)
            queries[id[i]] = run[i]

          commit(queries, true)
        }

        return () => id.forEach(id => cxt.unsubscribe(id, componentId.current))
      },
      emptyArr
    )
    */

    // getDerivedStateFromProps
    let nextState = null, unchangedQueries = {}

    if (strictShallowEqual(id, prevId.current) === false) {
      nextState = {id, queries: {}}
      prevId.current = id
    }

    for (let i = 0; i < id.length; i++) {
      let
        qid = id[i],
        query = cxt.getCached(qid),
        stateQuery = state.queries?.[qid]

      if (query === void 0) {
        query = cxt.subscribe(qid, componentId.current)
        cxt.setCached(qid, {status: WAITING})
        nextState = nextState || {queries: {}}
        nextState.queries[qid] = Object.assign({}, query)
      }
      else if (
        stateQuery === void 0
        || stateQuery.status !== query.status
        || stateQuery.response !== query.response
      ) {
        nextState = nextState || {queries: {}}
        nextState.queries[qid] = Object.assign({}, query)
      }
      else
        unchangedQueries[qid] = query
    }

    if (nextState !== null) {
      const waiting = id.filter(i => nextState.queries[i]?.status === WAITING)
      if (waiting.length > 0 && isNode === true && isQuery === true && ssrContext?.promises)
        ssrContext.push(load(waiting))
      Object.assign(nextState.queries, unchangedQueries)
      dispatch(nextState)
    }

    const childContext = useMemo(() => ({...state, reload}), [state, reload])
    console.log( `[${componentId.current}] child context`, childContext)
    return childContext
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
      cxt: PropTypes.shape({
        commitLocal: PropTypes.func.isRequired,
        commit: PropTypes.func.isRequired
      }),
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
