import {CDLL} from 'cdll-memoize'


export default function createCache (
  initialQueries = (
    typeof document !== 'undefined'
      && document.getElementById('radar-cache')
  )
) {
  const map = new Map()

  const cache = {
    get: map.get.bind(map),
    set (k, v) {
      let q = map.get(k)

      if (q === void 0) {
        q = {}
        map.set(k, q)
      }

      Object.assign(q, v)
      q.listeners && q.listeners.forEach(c => c.updateQuery(k, q))
    },
    subscribe (k, c) {
      let q = map.get(k)

      if (q === void 0) {
        q = {}
        map.set(k, q)
      }

      q.listeners = q.listeners || new CDLL()

      if (q.listeners.find(c) === void 0) {
        q.listeners.push(c)
      }
    },
    unsubscribe (k, c, parallel = false) {
      const query = map.get(k)
      if (query === void 0) return;
      const listeners = query.listeners

      if (listeners) {
        const el = listeners.find(c)

        if (el !== void 0) {
          listeners.delete(el)
        }

        if (listeners.size === 0) {
          if (query.commit && parallel === true) {
            query.commit.cancel()
            map.delete(k)
          }
        }
      }
    },
    setStatus: (k, v) => cache.set(k, {status: v}),
    setCommit: (k, v) => cache.set(k, {commit: v}),
    has: map.has.bind(map),
    delete: (...ks) => ks.forEach(k => map.delete(k)),
    map (fn) {
      const output = []
      map.forEach((v, k) => output.push(fn(k, v)))
      return output
    },
    clear: map.clear.bind(map),
    getIDs: map.keys.bind(map),
    toJSON (...a) {
      const output = {}

      map.forEach((v, k) => {
        output[k] = Object.assign({}, v)
        delete output[k].commit
        delete output[k].listeners
        delete output[k].query
        delete output[k].response.url
      })

      return JSON.stringify(output, ...a)
    },
    fromJSON (json) {
      const obj = JSON.parse(json)

      for (let k in obj) {
        map.set(k, obj[k])
      }
    }
  }

  cache.toString = cache.toJSON
  Object.defineProperty(cache, 'size', {get: () => map.size})

  if (initialQueries && typeof initialQueries === 'object') {
    const textContent = initialQueries.textContent

    if (textContent) {
      cache.fromJSON(initialQueries.textContent)
      while (initialQueries.firstChild) {
        initialQueries.removeChild(initialQueries.firstChild)
      }
    }
  }
  else if (typeof initialQueries === 'string') {
    cache.fromJSON(initialQueries)
  }

  return cache
}
