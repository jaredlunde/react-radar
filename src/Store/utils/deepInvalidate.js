import isPlainObject from '../../utils/isPlainObject'


const deepInvalidate = obj => {
  const isArray = Array.isArray(obj)

  if (isArray === true || isPlainObject(obj) === true) {
    let
      output = isArray ? [] : {},
      objKeys = Object.keys(obj),
      i = 0
    // let didChange = false
    for (; i < objKeys.length; i++)
      output[objKeys[i]] = deepInvalidate(obj[objKeys[i]]);

    return output
  }

  return obj
}

export default deepInvalidate
