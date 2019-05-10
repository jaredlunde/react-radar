import memoize from 'trie-memoize'
import {parser, normalize} from '../grammar'
import recursivelyRequire from './recursivelyRequire'


const requires = memoize(
  [Map, Map],
  (fields, requestedFields) => {
    let
      shape = {},
      i = 0,
      parsedFields = parser.parse(requestedFields)

    for (; i < parsedFields.length; i++) {
      const field = parsedFields[i]
      shape = recursivelyRequire(shape, fields, field)
    }

    return shape
  }
)


export default (availableFields, requestedFields) => {
  let normalizedFields = normalize(requestedFields)
  return normalizedFields.length === 0 ? null : requires(availableFields, normalizedFields)
}
