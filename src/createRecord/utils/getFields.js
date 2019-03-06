import memoize from 'trie-memoize'
import {parser, normalize} from '../grammar'
import recursivelyRequire from './recursivelyRequire'


const requires = memoize(
  [Map, Map],
  (fields, requestedFields) => {
    let shape = {}
    const parsedFields = parser.parse(requestedFields)

    for (let i = 0; i < parsedFields.length; i++) {
      const field = parsedFields[i]
      shape = recursivelyRequire(shape, fields, field)
    }

    return shape
  }
)


export default (availableFields, requestedFields) => {
  let normalizedFields = normalize(requestedFields)

  if (normalizedFields.length === 0) {
    // normalizedFields = stringify(availableFields)
    return null
  }

  return requires(availableFields, normalizedFields)
}
