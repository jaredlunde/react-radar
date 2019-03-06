import Promise from 'cancelable-promise'


export default ({body, headers}) => {
  let realHeaders

  if (headers === void 0 || headers === null) {
    realHeaders = headers
  } else if (typeof headers === 'function') {
    const promiseOrResult = headers(body)

    if (promiseOrResult && typeof promiseOrResult.then === 'function') {
      return promiseOrResult
    } else {
      realHeaders = promiseOrResult
    }
  } else {
    realHeaders = headers
  }

  // realHeaders = new Headers(realHeaders)
  return Promise.resolve(realHeaders || {})
}
