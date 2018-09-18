export default async function resolveSynchronously (promises) {
  // Has side-effects on @promises
  let response

  if (promises.length) {
    const [next, resolve, reject] = promises[0]
    resolve(await next)
    promises.shift()
    resolveSynchronously(promises)
  }

  return response
}
