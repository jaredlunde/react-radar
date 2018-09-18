import isPlainObject from '../../utils/isPlainObject'


export default function deepInvalidate (obj) {
  const isArray = Array.isArray(obj)

  if (isArray || isPlainObject(obj)) {
    const output = isArray ? [] : {}
    const objKeys = Object.keys(obj)
    // let didChange = false

    for (let x = 0; x < objKeys.length; x++) {
      const key = objKeys[x]
      output[key] = deepInvalidate(obj[key])
    }

    return output
  }

  return obj
}
