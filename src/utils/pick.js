import memoize from 'trie-memoize'
import isPlainObject from './isPlainObject'
// import Immutable from 'seamless-immutable'

export const pickShape = (from, shape) => {
  if (shape === null) {
    return __DEV__ ? Object.freeze(from) : from
  }

  const output = {}
  shape = shape.isRadarRecord || shape.isRadarUnion ? shape.fields : shape
  const shapeKeys = Object.keys(shape)

  for (let i = 0; i < shapeKeys.length; i++) {
    const key = shapeKeys[i]
    const fromVal = from[key]

    if (fromVal !== void 0) {
      // with a lot of data models, memoizing should reduce a lot of work
      // the way store records are structured (immutable and re-used)
      output[key] = (
        typeof fromVal === 'object'
          ? shape[key] !== null && typeof shape[key] === 'object'
            ? pick(fromVal, shape[key])
            : fromVal
          : fromVal
      )
    }
  }

  // return Immutable(output)
  return __DEV__ ? Object.freeze(output) : output
}

// picks a shape {foo: null, bar: null} out of an object
// (from) [{foo: 'abweb', bar: 'babeob'}]
export const pick = memoize([WeakMap, WeakMap], (from, shape) => {
  if (Array.isArray(from) === true) {
    const output = []
    for (let i = 0; i < from.length; i++) output.push(pickShape(from[i], shape));
    return __DEV__ ? Object.freeze(output) : output
  }
  else if (isPlainObject(from) === true) {
    return pickShape(from, shape)
  }
  else {
    return from
  }
})

export default pick
