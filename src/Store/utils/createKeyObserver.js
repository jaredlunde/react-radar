export default () => {
  let id = -1
  const buckets = new Map()

  return {
    buckets,

    getBits (keys) {
      let bits = 0

      if (buckets === void 0) {
        return bits
      }

      for (let i = 0; i < keys.length; i++) {
        let bucketId = buckets.get(keys[i])

        if (bucketId === void 0) {
          // this is here in the situation that one connects to a prop that hasn't
          // been fetched yet
          buckets.set(keys[i], ++id)
          bucketId = id
        }

        bits |= (1 << (bucketId % 30))
      }

      return bits
    },

    setBuckets (data) {
      const dataKeys = Object.keys(data)

      for (let i = 0; i < dataKeys.length; i++) {
        const key = dataKeys[i]
        if (buckets.has(key) === false) {
          buckets.set(key, ++id)
        }
      }
    },
  }
}