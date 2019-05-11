import React, {useState, useMemo, useEffect, useContext, useCallback, useRef}  from 'react'
import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import {ServerPromisesContext} from '@react-hook/server-promises'
import {WAITING, LOADING, ERROR, DONE, getQueryID} from './Store/Endpoint'
import {EndpointContext} from './Store'
import {isNode, strictShallowEqual} from './utils'


const
  is = ['waiting', 'error', 'loading', 'done'],
  getAggregateStatus = queries => Math.min(...Object.values(queries).map(q => q.status))

export const getID = queries =>
  Array.isArray(queries) ? queries.map(getQueryID) : [getQueryID(queries)]

const getState = ({run, endpoint}) => {
  let i = 0, id = getID(run), state = {id, queries: {}}

  for (; i < id.length; i++) {
    const
      query = endpoint.getCached(id[i]),
      status = query?.status === void 0 ? WAITING : query.status

    if (query !== void 0)
      query.query = query.query || run[i]

    state.queries[id[i]] = {status, response: query ? query.response : null}
  }

  state.status = getAggregateStatus(state.queries)
  state.is = is[state.status]
  return state
}

export const createQueryComponents = (isQuery = false) => {
  const
    name = isQuery === true ? 'Query' : 'Updater',
    type = isQuery ? 'QUERY' : 'UPDATE'

  const useQuery = ({run, parallel, async, forceReload}) => {
    run = useMemo(() => Array.isArray(run) === true ? run : [run], [run])
    const
      ssrContext = useContext(ServerPromisesContext),
      endpoint = useContext(EndpointContext),
      [state, setState] = useState({}),
      prevId = useRef(emptyArr)

    const subscribeAll = useCallback(
      () => {
        for (let i = 0; i < state.id.length; i++)
          endpoint.subscribe(state.id[i], this)
      },
      [endpoint, state.id]
    )

    const unsubscribeAll = useCallback(
      () => state.id.forEach(id => endpoint.unsubscribe(id, this)),
      [state.id]
    )

    const commit = useCallback(
      (queriesObject = emptyObj, fromCache = false) => {
        const queries = Object.values(queriesObject)

        if (queries.length > 0)
          return endpoint[fromCache === true ? 'commitFromCache' : 'commit'](
            {queries, type},
            {async}
          )
        else
          return Promise.all(state.id.map(id => endpoint.getCached(id).commit))
      },
      [endpoint, state.id, async]
    )

    const load = useCallback(
      () => {
        let queries = {}, i = 0

        for (; i < state.id.length; i++) {
          let id = state.id[i]
          endpoint.subscribe(id, this)
          const query = endpoint.getCached(id)
          // this will only run queries that aren't currently in a loading, done, or error state
          if (query.status === void 0 || query.status === WAITING) {
            queries[id] = run[i]
            endpoint.setCached(id, {query: queries[id], status: LOADING, response: null})
          }
        }
        // parallel means that the queries are sent separately *over the network*, but they will
        // still be added to the store synchronously
        return parallel === true
          ? Promise.all(Object.keys(queries).map(id => commit({[id]: queries[id]})))
          : commit(queries)
      },
      [endpoint, commit, parallel, state.id]
    )

    const reload = useCallback(
      (ids = emptyArr) => {
        ids = ids.length > 0 && typeof ids[0] === 'string' ? ids : state.id
        ids.forEach(id => {
          const query = endpoint.getCached(id)
          if (query !== void 0 && query.status !== LOADING)
            endpoint.setCached(id, {status: WAITING})
        })

        return load()
      },
      [endpoint, state.id]
    )

    // constructor-ish
    useMemo(
      () => {
        if (isNode === true && isQuery === true && ssrContext?.promises)
          ssrContext.promises.push(load())
      },
      emptyArr
    )

    // componentDidMount
    useEffect(
      () => {
        if (isQuery === false)
          subscribeAll()
        else {
          const
            statuses = Object.values(state.queries).map(q => q.status),
            anyDone = statuses.some(s => s === DONE)

          if (anyDone === true && forceReload === true)
            reload()
          else if (
            anyDone === false
            || statuses.some(s => s !== DONE && s !== LOADING) === true
          )
            load()
          else {
            subscribeAll()
            let queries = {}, i = 0

            for (; i < state.id.length; i++)
              queries[state.id[i]] = run[i]

            commit(queries, true)
          }
        }

        // componentWillUnmount
        return unsubscribeAll
      },
      emptyArr
    )

    // componentDidUpdate
    useEffect(
      () => {
        if (isQuery === false && strictShallowEqual(prevId.current, state.id) === false)
          id.forEach(pid => state.id.indexOf(pid) === -1 && endpoint.unsubscribe(pid, this))
        else {
          let needsReload = [], loadCached = {}, loadFromCache = false, i = 0

          for (; i < state.id.length; i++) {
            const id = state.id[i], query = endpoint.getCached(id_)

            if (prevId.current.indexOf(id) === -1 ) {
              if (status === void 0 || query === void 0 || query.status === WAITING) {
                needsReload.push(id)
              }
              else if (query.status === DONE) {
                endpoint.subscribe(id, this)
                loadCached[id] = run[i]
                loadFromCache = true
              }
            }
          }

          if (loadFromCache === true)
            commit(loadCached, true)

          if (needsReload.length > 0)
            reload(needsReload)

          prevId.current = state.id
        }

        return () => {
          const id = prevId.current
          for (let i = 0; i < id.length; i++)
            if (state.id.indexOf(id[i]) === -1)
              endpoint.unsubscribe(id[i], this)
        }
      },
      [state.id, endpoint, reload, commit]
    )

    return state
  }

  const Query = () => {}
  if (__DEV__) Query.displayName = name
  Query.WAITING = WAITING
  Query.ERROR = ERROR
  Query.LOADING = LOADING
  Query.DONE = DONE
  return [useQuery, Query]
}

const [useQuery, Query] = createQueryComponents()
export {Query, useQuery}
