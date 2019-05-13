import {objectWithoutProps} from '../utils'


const
  jsonExclusions = {commit: 0, listeners: 0, query: 0},
  urlExclusion = {url: 0}

export default (
  initialQueries = (
    typeof document !== 'undefined'
      && document.getElementById('radar-cache')
  )
) => {
  const
    map = new Map(),
    cache = {
      get: map.get.bind(map),
      set (id, v) {
        let q = map.get(id)

        if (q === void 0) {
          q = {}
          map.set(id, q)
        }

        Object.assign(q, v)
        q.listeners && q.listeners.forEach(notify => notify(id, q))
        return q
      },
      subscribe (id, notify) {
        let q = map.get(id)

        if (q === void 0) {
          q = {}
          map.set(id, q)
        }

        (q.listeners = q.listeners || new Set()).add(notify)
      },
      unsubscribe (id, notify) {
        const query = map.get(id)
        if (query === void 0) return
        const listeners = query.listeners

        if (listeners) {
          listeners.delete(notify)
          // deletes this query from the cache if there are no more listeners
          if (listeners.size === 0)
            map.delete(id)
        }
      },
      // TODO: this should not be needed due to ref counting.... but we'll see
      // collect: () => {
      //   // only deletes queries that aren't in loading states
      //   for (let [id, query] of map.entries())
      //     if (query?.listeners?.size === 0 && query.status === 3)
      //       map.delete(id)
      // },
      get size () { return map.size },
      forEach: map.forEach.bind(map),
      toJSON (...a) {
        const output = {}

        map.forEach((v, k) => {
          if (v.status !== 0) {
            output[k] = objectWithoutProps(v, jsonExclusions)
            if (output[k].response)
              output[k].response = objectWithoutProps(output[k].response, urlExclusion)
          }
        })

        return JSON.stringify(output, ...a)
      },
      fromJSON (json) {
        let
          obj = JSON.parse(json),
          keys = Object.keys(obj),
          i = 0

        for (; i < keys.length; i++) map.set(keys[i], obj[keys[i]])
      }
    }
  cache.toString = cache.toJSON

  if (initialQueries && typeof initialQueries === 'object') {
    const textContent = initialQueries?.firstChild?.data

    if (textContent) {
      cache.fromJSON(initialQueries.textContent)
      while (initialQueries.firstChild)
        initialQueries.removeChild(initialQueries.firstChild)
    }
  }
  else if (typeof initialQueries === 'string')
    cache.fromJSON(initialQueries)

  return cache
}
