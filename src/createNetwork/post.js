import isNode from '../utils/isNode'


if (typeof fetch === 'undefined' && isNode === false) {
  require('unfetch/polyfill')
}


export async function post (url, opt) {
  let r, headers = {}

  try {
    r = await fetch(url, opt)

    for (let name of r.headers.keys()) {
      headers[name] = r.headers.get(name)
    }

    return {
      ok: r.ok,
      url: r.url,
      headers,
      status: r.status,
      statusText: r.statusText,
      json: r.ok === true ? await r.json() : false
    }
  }
  catch (errorMsg) {
    // with CORS requests you cannot get the response object evidently
    // so this error mitigates that
    return {
      ok: false,
      headers: r ? headers : {},
      status: r ? r.status : 520,
      statusText: r ? r.statusText : 'Unknown Error',
      errorMsg: String(errorMsg),
      json: false
    }
  }
}
