import memoize from 'trie-memoize'
import isPlainObject from './isPlainObject'
// import Immutable from 'seamless-immutable'


export const pickShape = (from, shape) => {
  if (shape === null) {
    return from
  }

  const output = {}
  shape = shape.isRadarRecord || shape.isRadarUnion ? shape.fields : shape
  const shapeKeys = Object.keys(shape)

  for (let x = 0; x < shapeKeys.length; x++) {
    const key = shapeKeys[x]
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
  if (Array.isArray(from)) {
    const output = []

    for (let x = 0; x < from.length; x++) {
      output.push(pickShape(from[x], shape))
    }

    // return Immutable(output)
    return __DEV__ ? Object.freeze(output) : output
  }
  else if (isPlainObject(from)) {
    return pickShape(from, shape)
  }
  else {
    return from
  }
})

export default pick
