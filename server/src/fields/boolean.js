import Field from './Field'


export class BooleanField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || Boolean
    super(opt)
  }
}

export default new BooleanField()
