import Field from './Field'


export class FloatField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || parseFloat
    super(opt)
  }
}

export default new FloatField()
