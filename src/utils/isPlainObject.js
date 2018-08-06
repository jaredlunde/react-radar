export default function (o) {
  if (o !== null && typeof o === 'object') {
    const proto = Object.getPrototypeOf(o)
    return proto === Object.prototype || proto === null
  }

  return false
}
