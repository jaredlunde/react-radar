const cache = {}

export default strings => {
  if (cache[strings] !== void 0) {
    return cache[strings]
  }
  else {
    const out = cache[strings] = {}
    strings = strings.split(',')

    for (let x = 0; x < strings.length; x++) {
      const strArr = strings[x].split('.')

      if (strArr.length === 1) {
        out[strArr[0]] = null
      }
      else {
        const baseKey = strArr[0]

        if (out[baseKey] === void 0) {
          out[baseKey] = {}
        }

        const shape = {}
        let nextShape = shape

        for (let y = 1; y < strArr.length; y++) {
          const key = strArr[y]
          nextShape[key] = y === strArr.length - 1 ? null : {}
          nextShape = nextShape[key]
        }

        Object.assign(out[baseKey], shape)
      }
    }

    return out
  }
}
