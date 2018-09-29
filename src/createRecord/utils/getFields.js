import memoize from 'memoize-two-args'
import {parser, normalize} from '../grammar'
import recursivelyRequire from './recursivelyRequire'
import stringify from './stringify'


const requires = memoize(
  function (fields, requestedFields) {
    let shape = {}
    const parsedFields = parser.parse(requestedFields)

    for (let i = 0; i < parsedFields.length; i++) {
      const field = parsedFields[i]
      shape = recursivelyRequire(shape, fields, field)
    }

    return shape
  },
  Map
)


export default function (availableFields, requestedFields) {
  let normalizedFields = normalize(requestedFields)

  if (normalizedFields.length === 0) {
    // normalizedFields = stringify(availableFields)
    return null
  }

  return requires(availableFields, normalizedFields)
}
