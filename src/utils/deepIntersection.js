import isPlainObject from './isPlainObject'


const deepIntersection = (...objects) => {
  let keys = [], i = 0, j = 0

  for (; i < objects.length; i++) {
    const object = objects[i]

    if (keys.length === 0) {
      keys = Object.keys(object)
      continue
    }

    const objKeys = Object.keys(object)
    const newKeys = []
    for (j = 0; j < objKeys.length; j++) {
      const key = keys[j]
      if (objKeys.indexOf(key) > -1)
        newKeys.push(key)
    }

    keys = newKeys
  }

  const output = {}

  for (i = 0; i < keys.length; i++) {
    const key = keys[i]
    const deepObjects = []

    for (j = 0; j < objects.length; j++) {
      const object = objects[j]
      const deep = object[key]

      if (isPlainObject(deep)) {
        deepObjects.push(deep)
      } else if (typeof deep === 'function' && (deep.isRadarRecord || deep.isRadarUnion)) {
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

export default deepIntersection