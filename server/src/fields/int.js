import Field from './Field'


export class IntField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || parseInt
    super(opt)
  }
}

export default new IntField()
