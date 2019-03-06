import Field from './Field'


export class IntegerField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || parseInt
    super(opt)
  }
}

export default new IntegerField()
