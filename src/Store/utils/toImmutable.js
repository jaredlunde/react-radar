import memoize from 'trie-memoize'
import isPlainObject from '../../utils/isPlainObject'


export const toImmutable = memoize([WeakMap], obj => {
  const isArray = Array.isArray(obj)

  if (isArray === true || isPlainObject(obj) === true) {
    let
      output = isArray === true ? [] : {},
      objKeys = Object.keys(obj),
      i = 0

    for (; i < objKeys.length; i++) {
      const key = objKeys[i], val = obj[key]
      // checks if the value is a store record. if so we want to avoid
      // memoizing it directly.
      output[key] = (
        val === null || val === void 0
          ? val
          : val.toImmutable !== void 0
            ? val.toImmutable()
            : typeof val === 'object'
              ? toImmutable(val)
              : val
      )
    }

    return __DEV__ ? Object.freeze(output) : output
  }

  return obj
})

export default toImmutable
