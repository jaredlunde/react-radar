export default async function resolveSynchronously (promises) {
  // Has side-effects on @promises
  if (promises.length) {
    const [next, resolve] = promises[0]
    resolve(await next)
    promises.shift()
    resolveSynchronously(promises)
  }
}
