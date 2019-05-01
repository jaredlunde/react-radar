import isPlainObject from '../../utils/isPlainObject'


const deepInvalidate = obj => {
  const isArray = Array.isArray(obj)

  if (isArray || isPlainObject(obj)) {
    const
      output = isArray ? [] : {},
      objKeys = Object.keys(obj)
    // let didChange = false

    for (let i = 0; i < objKeys.length; i++)
      output[objKeys[i]] = deepInvalidate(obj[objKeys[i]]);

    return output
  }

  return obj
}

export default deepInvalidate
