const resolveSynchronously = promises => {
  // Has side-effects on @promises
  if (promises.length) {
    const [next, resolve] = promises[0]
    next.then(value => {
      resolve(value)
      promises.shift()
      resolveSynchronously(promises)
    })
  }
}

export default resolveSynchronously