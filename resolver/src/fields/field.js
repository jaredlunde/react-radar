import emptyObj from 'empty/object'


function defaultResolver (fieldName, state, context = emptyObj) {
  if (__DEV__) {
    const {record = null, query = null,/*...otherContext*/} = context

    if (state.hasOwnProperty(fieldName) === false) {
      throw (
        `Field '${fieldName}' was undefined in Record '${record.name}' of ` +
        `Query '${query.name}'`
      )
    }
  }

  const result = state[fieldName]
  return result
}

function defaultCast (x) {
  return x
}

export default class Field extends Function {
  constructor (opt = emptyObj) {
    const {
      resolver = defaultResolver,
      defaultValue = null,
      cast = defaultCast
    } = opt

    return Object.setPrototypeOf(
      function resolve (name, state, context) {
        let value = resolver(name, state, context)
        return value === null ? defaultValue : cast(value)
      },
      new.target.prototype
    )
  }
}
