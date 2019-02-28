import Immutable from 'seamless-immutable'
import memoize from 'trie-memoize'
import isPlainObject from '../../utils/isPlainObject'
// import isStoreRecord from './isStoreRecord'


export function toImmutable (obj) {
  const isArray = Array.isArray(obj)

  if (isArray || isPlainObject(obj)) {
    const output = isArray ? [] : {}
    const objKeys = Object.keys(obj)

    for (let x = 0; x < objKeys.length; x++) {
      const key = objKeys[x]
      const val = obj[key]
      // checks if the value is a store record. if so we want to avoid
      // memoizing it directly.

      output[key] = (
        val === null || val === void 0
        ? val
        : val.toImmutable !== void 0
          ? val.toImmutable()
          : typeof val === 'object'
            ? toImmutableMemoized(val)
            : val
      )
    }

    return Immutable(output)
  }

  return obj
}


const toImmutableMemoized = memoize([WeakMap], toImmutable)
export default toImmutableMemoized
