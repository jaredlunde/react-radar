import Field from './Field'
import invariant from 'invariant'
import {promiseAllValues} from '../utils'


export class MappingField extends Field {
  constructor (opt) {
    if (__DEV__) {
      invariant(
        opt.resolves,
        `Property 'resolves' is required in ObjectField.`
      )
    }

    if (opt.resolver === void 0) {
      opt.resolver = function (state, props, context) {
        const result = {}

        for (let fieldName in context.requires || opt.resolves) {
          if (__DEV__) {
            invariant(
              opt.resolves[fieldName] !== void 0,
              `Field '${fieldName}' not found in ObjectField '${context.fieldName}'`
            )
          }

          const field = opt.resolves[fieldName]
          const childContext = Object.assign(
            {},
            context,
            {
              fieldName,
              requires: context.requires[context.fieldName]
            }
          )

          result[fieldName] =
            field instanceof Field && !(field instanceof MappingField)
              ? field(state, props, childContext)
              : field(state[context.fieldName], props, childContext)
        }

        return promiseAllValues(result)
      }
    }

    super(opt)

    for (let key in opt) {
      this[key] = opt[key]
    }
  }

  each (state, props, context) {
    const result = []
    const obj = new MappingField(this.opt)
    let index = 0

    while (true) {
      context = Object.assign({index}, context)
      result.push(obj(state, props, context))
      index += 1
    }

    return result
  }
}

export default function mapping (resolves) {
  return new MappingField({resolves})
}
