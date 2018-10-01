export function equalKeys (o1, o2) {
  // Get the keys of each object
  const o1keys = Object.keys(o1)
  const o2keys = Object.keys(o2)

  if (o1keys.length !== o2keys.length) {
    return false
  }

  return o1keys.sort().join() === o2keys.sort().join()
}

export function promiseAllValues (result) {
  return Promise.all(Object.values(result)).then(
    state => {
      const names = Object.keys(result)

      for (let i = 0; i < names.length; i++) {
        result[names[i]] = state[i]
      }

      return result
    }
  )
}
