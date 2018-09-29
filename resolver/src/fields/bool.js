import Field from './Field'


export class BoolField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || Boolean
    super(opt)
  }
}

export default new BoolField()
