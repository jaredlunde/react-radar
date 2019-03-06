import Field from './Field'


export class SingleField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || parseFloat
    super(opt)
  }
}

export default new SingleField()
