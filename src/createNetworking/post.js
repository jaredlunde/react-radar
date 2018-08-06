import Promise from 'cancelable-promise'


export const fakeJSONResponse = () => new Promise(function (resolve) { resolve(null) })


export default function post (url, init) {
  // Wrapped in a cancelable promise to skip resolving if we 'abort' a query or
  // action
  return new Promise(
    async function (resolve) {
      try {
        resolve(await fetch(url, init))
      } catch (errorMsg) {
        // with CORS requests you cannot get the response object evidently
        // so this error mitigates that
        resolve({
          ok: false,
          status: 520,
          statusText: 'Unknown Error',
          errorMsg,
          json: fakeJSONResponse
        })
      }
    }
  )
}
