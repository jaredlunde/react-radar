import {getFields} from './createRecord/utils'
import {invariant, tag, deepIntersection} from './utils'


const getSharedFields = records => {
  let
    recs = [],
    values = Object.values(records),
    i = 0

  for (; i < values.length; i++)
    recs.push(values[i].fields)

  return deepIntersection(...recs)
}

export default ({records}) => {
  if (__DEV__)
    invariant(records, `Unions must be constructed with a \'records\' option.`)

  const sharedFields = getSharedFields(records)

  function Union (requestedFields, ...values) {
    const nullFields = getFields(records, tag(requestedFields, ...values))
    return {fields: nullFields}
  }

  Union.isRadarUnion = true
  Union.fields = records
  Union.sharedFields = sharedFields
  return Union
}
