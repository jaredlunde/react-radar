export default () => {
  const KeyObserver = {
    buckets: [],
    clear: () => KeyObserver.buckets = [],

    getBits (keys) {
      const {buckets} = KeyObserver
      let bits = 0

      if (buckets === void 0) {
        return bits
      }

      for (let i = 0; i < keys.length; i++) {
        let idx = buckets.indexOf(keys[i])

        if (idx === -1) {
          // this is here in the situation that one connects to a prop that hasn't
          // been fetched yet
          buckets.push(keys[i])
          idx = buckets.length - 1
        }

        bits |= (1 << (idx % 31))
      }

      return bits
    },

    setBuckets (data) {
      const dataKeys = Object.keys(data)
      const {buckets} = KeyObserver

      for (let i = 0; i < dataKeys.length; i++) {
        const key = dataKeys[i]
        if (buckets.indexOf(key) === -1) {
          buckets.push(key)
        }
      }
    },
  }

  return KeyObserver
}