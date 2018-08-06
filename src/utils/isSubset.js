function isSubset (superset, subset) {
  if (superset === subset) {
    return true
  }

  // here for fishy needs. will have to look into this
  if (subset === null || subset === void 0 || superset === null || superset === void 0) {
    return false
  }

  if (typeof superset === 'object' && typeof subset === 'object') {
    if (superset.getTime !== void 0 || subset.getTime !== void 0) {
      return subset.constructor === superset.constructor
        ? superset.valueOf() === subset.valueOf()
        : false
    }

    const subsetKeys = Object.keys(subset)
    for (let x = 0; x < subsetKeys.length; x++) {
      const key = subsetKeys[x]
      const supersetItem = superset[key]

      //if (superset.hasOwnProperty(key) === false) {
      if (supersetItem === void 0) {
        return false
      }
      const subsetItem = subset[key]

      if (isSubset(supersetItem, subsetItem) === false) {
        return false
      }
    }

    return true
  } else {
    return false
  }
}


export default isSubset
