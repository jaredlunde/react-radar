async function resolveSynchronously (promises) {
  // Has side-effects on @promises
  let response

  if (promises.length) {
    const [next, resolve, reject, ...other] = promises[0]
    response = await next
    // Just resolve everything to avoid throwing errors/warnings.
    // Let the user decide what to do with the response status.
    resolve(response)
    promises.shift()
    resolveSynchronously(promises)
  }

  return response
}


export default resolveSynchronously
