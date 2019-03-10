import isPlainObject from '../../utils/isPlainObject'


const deepInvalidate = obj => {
  const isArray = Array.isArray(obj)

  if (isArray || isPlainObject(obj)) {
    const output = isArray ? [] : {}
    const objKeys = Object.keys(obj)
    // let didChange = false

    for (let i = 0; i < objKeys.length; i++) {
      output[objKeys[i]] = deepInvalidate(obj[objKeys[i]])
    }

    return __DEV__ ? Object.freeze(output) : output
  }

  return __DEV__ ? Object.freeze(obj) : obj
}

export default deepInvalidate
