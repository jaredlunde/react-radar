import Field from './Field'


function stringCast (string) {
  // uses JSON string where avaiable (e.g. Date)
  if (string.toJSON !== void 0) {
    return string.toJSON()
  }
  else {
    return String(string)
  }
}

export class StringField extends Field {
  constructor (opt = {}) {
    opt.cast = opt.cast || stringCast
    super(opt)
  }
}

export default new StringField()
