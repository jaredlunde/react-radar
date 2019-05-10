const isSubset = (superset, subset) => {
  if (superset === subset) return true
  // here for fishy needs. will have to look into this
  if (subset === null || subset === void 0 || superset === null || superset === void 0)
    return false

  if (typeof superset === 'object' && typeof subset === 'object') {
    if (superset.getTime !== void 0 || subset.getTime !== void 0)
      return subset.constructor === superset.constructor
        ? superset.valueOf() === subset.valueOf()
        : false

    let
      subsetKeys = Object.keys(subset),
      i = 0

    for (; i < subsetKeys.length; i++) {
      const
        key = subsetKeys[i],
        supersetItem = superset[key]
      if (supersetItem === void 0 || isSubset(supersetItem, subset[key]) === false)
        return false
    }

    return true
  } else {
    return false
  }
}

export default isSubset
