export default o => {
  if (typeof o === 'object' && o !== null) {
    const proto = Object.getPrototypeOf(o)
    return proto === Object.prototype || proto === null
  }

  return false
}
