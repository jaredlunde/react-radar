const proto = Object.prototype, getProto = Object.getPrototypeOf, isArray = Array.isArray
export default o => {
  if (typeof o === 'object' && isArray(o) === false && o !== null)
    return getProto(o) === proto

  return false
}
