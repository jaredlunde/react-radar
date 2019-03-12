export default (objA, objB) => {
  if (objA === objB) {
    return true
  }

  const aKeys = Object.keys(objA),
        keyLen = aKeys.length

  if (keyLen !== Object.keys(objB).length) {
    return false
  }

  for (let i = 0; i < keyLen; i++) {
    if (objA[aKeys[i]] !== objB[aKeys[i]]) {
      return false
    }
  }

  return true
}