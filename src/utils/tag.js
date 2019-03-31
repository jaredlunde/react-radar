import emptyArr from 'empty/array'

export default (strings, values = emptyArr) => {
  let output = '', i = 0

  for (; i < strings.length; i++) {
    const string = strings[i]
    const value = values[i]
    output += string + (
      value === void 0
      ? ''
      : value.toString === void 0
        ? value
        : value.toString()
    )
  }

  return output
}
