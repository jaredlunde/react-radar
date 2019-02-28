export default (obj, props) => {
  const next = {}
  const keys = Object.keys(obj)

  for (let i = 0; i < keys.length; i++) {
    if (props[keys[i]] === void 0) {
      next[keys[i]] = obj[keys[i]]
    }
  }

  return next
}