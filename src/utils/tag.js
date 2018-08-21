export default function tag (strings, values) {
  let output = ''

  for (let x = 0; x < strings.length; x++) {
    const string = strings[x]
    const value = values[x]
    output += string + (
      value === void 0
      ? ''
      : value.toString !== void 0
        ? value.toString()
        : value
    )
  }

  return output
}
