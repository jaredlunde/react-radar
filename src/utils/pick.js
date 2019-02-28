import memoize from 'trie-memoize'
import isPlainObject from './isPlainObject'
import Immutable from 'seamless-immutable'


export function pickShape (from, shape) {
  if (shape === null) {
    return Immutable(from)
  }

  const output = {}
  const origShape = shape
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
        ? memoizedPick(fromVal, shape[key])
        : fromVal
      )
    }
  }

  return Immutable(output)
}


// picks a shape {foo: null, bar: null} out of an object
// (from) [{foo: 'abweb', bar: 'babeob'}]
export function pick (from, shape) {
  if (Array.isArray(from)) {
    const output = []

    for (let x = 0; x < from.length; x++) {
      output.push(pickShape(from[x], shape))
    }

    return Immutable(output)
  }
  else if (isPlainObject(from)) {
    return pickShape(from, shape)
  }
  else {
    return from
  }
}


const memoizedPick = memoize([WeakMap, Map], pick)
export default memoizedPick
