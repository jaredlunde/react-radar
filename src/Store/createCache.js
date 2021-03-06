import {objectWithoutProps} from '../utils'


const
  jsonExclusions = {listeners: 0, query: 0},
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
        if (q.listeners !== void 0) {
          const action = {type: 'update', id, query: q}
          for (let i = 0; i < q.listeners.length; i++)
            q.listeners[i](action)
        }

        return q
      },
      subscribe (id, notify) {
        let q = map.get(id)

        if (q === void 0) {
          q = {status: 0}
          map.set(id, q)
        }

        (q.listeners = q.listeners || []).push(notify)
      },
      unsubscribe (id, notify) {
        const query = map.get(id)
        if (query === void 0) return
        const listeners = query.listeners

        if (listeners !== void 0) {
          // removes the listener from the query's listeners arry
          listeners[listeners.indexOf(notify)] = listeners[listeners.length - 1]
          listeners.pop()
          // deletes this query from the cache if there are no more listeners
          if (listeners.length === 0)
            map.delete(id)
        }
      },
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
