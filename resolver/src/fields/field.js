import emptyObj from 'empty/object'


function defaultResolver (state, props, context) {
  const {fieldName} = context

  if (__DEV__) {
    const {record, query,/*...otherContext*/} = context
    if (!state || state.hasOwnProperty(fieldName) === false) {
      throw (
        `Field '${fieldName}' was undefined in Query '${query.name}' of ` +
        `Record: ${record.name}`
      )
    }
  }

  return state[fieldName]
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
      function resolve (...args) {
        let value = resolver(...args)
        return value === null || value === void 0 ? defaultValue : cast(value)
      },
      new.target.prototype
    )
  }
}
