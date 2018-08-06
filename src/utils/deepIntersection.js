import isPlainObject from './isPlainObject'


export default function deepIntersection (...objects) {
  let keys = []

  for (let x = 0; x < objects.length; x++) {
    const object = objects[x]

    if (keys.length === 0) {
      keys = Object.keys(object)
      continue
    }

    const objKeys = Object.keys(object)
    const newKeys = []
    for (let y = 0; y < objKeys.length; y++) {
      const key = keys[y]
      if (objKeys.indexOf(key) > -1) {
        newKeys.push(keys[y])
      }
    }
    keys = newKeys
    // keys = keys.filter(key => objKeys.includes(key))
  }

  const output = {}

  for (let x = 0; x < keys.length; x++) {
    const key = keys[x]
    const deepObjects = []

    for (let y = 0; y < objects.length; y++) {
      const object = objects[y]
      const deep = object[key]

      if (isPlainObject(deep)) {
        deepObjects.push(deep)
      } else if (
        typeof deep === 'function'
        && (deep.isRadarRecord || deep.isRadarUnion)
      ) {
        deepObjects.push(deep.fields)
      }
    }

    let deepIntersections = null

    if (deepObjects.length === objects.length) {
      deepIntersections = deepIntersection(...deepObjects)
    }

    output[key] = (
      deepIntersections === null || Object.keys(deepIntersections).length === 0
      ? null
      : deepIntersections
    )
  }

  return output
}
