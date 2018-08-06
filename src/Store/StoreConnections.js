const StoreConnections = {
  map: new Map(),

  get: store => StoreConnections.map.get(store),
  set: (store, buckets) => StoreConnections.map.set(store, buckets),
  dispose: store => StoreConnections.map.delete(store),
  clear: () => StoreConnections.map.clear(...arguments),

  getBits: function (store, keys) {
    const buckets = StoreConnections.map.get(store)
    let bits = 0

    if (buckets === void 0) {
      return bits
    }

    const newBuckets = []
    let newBucketIdx = buckets.length

    for (let x = 0; x < keys.length; x++) {
      const idx = buckets.indexOf(keys[x])

      if (idx === -1) {
        newBuckets.push(keys[x])
        idx = newBucketIdx
        newBucketIdx++
      }

      bits |= (1 << (idx % 31))
    }

    if (newBuckets.length > 0) {
      StoreConnections.set(store, [...buckets, ...newBuckets])
    }

    return bits
  },

  setBuckets: function (store, data) {
    const prevBuckets = StoreConnections.map.get(store) || []
    const dataKeys = Object.keys(data)
    const buckets = [...prevBuckets]

    for (let x = 0; x < dataKeys.length; x++) {
      const key = dataKeys[x]

      if (buckets.indexOf(key) === -1) {
        buckets.push(key)
      }
    }

    StoreConnections.map.set(store, buckets)
  },
}


export default StoreConnections
