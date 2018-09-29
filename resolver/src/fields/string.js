import Field from './Field'


export class StringField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || String
    super(opt)
  }
}

export default new StringField()
