export function createMask () {
  let nMask = 0,
      nFlag = 0,
      nLen = arguments.length > 31 ? 31 : arguments.length

  for (nFlag; nFlag < nLen; nMask |= arguments[nFlag] << nFlag++);
  return nMask
}


export default class BitMask {
  constructor (value, base = 30) {
    this.base = base
    this.value = value ? parseInt(value, base) : 0
  }
  
  has (bit) {
    return (this.value & bit) === bit
  }

  toString () {
    return this.value.toString(2);
  }

  setValue (value) {
    this.value = parseInt(value, base)
  }
}
