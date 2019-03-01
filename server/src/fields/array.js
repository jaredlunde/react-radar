import Field from './Field'


function castArray (cast) {
  return function (value) {
    const result = []

    for (let val of value) {
      result.push(cast(val))
    }

    return result
  }
}

export class ArrayField extends Field {
  constructor (opt = {}) {
    opt.cast = castArray(opt.cast || String)
    super(opt)
  }
}

export default function array (cast) {
  return new Array({cast})
}
