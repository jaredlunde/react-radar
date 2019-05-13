export default () => {
  let
    id = -1,
    i = 0,
    buckets = new Map(),
    setShard = key => buckets.has(key) === false && buckets.set(key, ++id)

  return {
    buckets,

    getBits (keys) {
      // determines which context shard given keys reside in
      let bits = 0

      if (buckets === void 0)
        return bits

      for (i = 0; i < keys.length; i++) {
        let bucketId = buckets.get(keys[i])

        if (bucketId === void 0) {
          // this is here in the situation that one connects to a prop that hasn't
          // been fetched yet
          buckets.set(keys[i], ++id)
          bucketId = id
        }
        // flips the bit in the bucketId position to 1
        bits |= (1 << (bucketId % 30))
        // bails out if all of the bits are switched to 1
        if (bits === 1073741823) break
      }

      return bits
    },

    setShards (data) {
      // assigns a unique id to each key name for context sharding
      const dataKeys = Object.keys(data)
      for (i = 0; i < dataKeys.length; i++)
        setShard(dataKeys[i])
    },

    setShard
  }
}