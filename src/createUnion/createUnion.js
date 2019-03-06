import {getFields} from '../createRecord/utils'
import {invariant, tag} from '../utils'
import {getSharedFields} from './utils'


export default ({records}) => {
  if (__DEV__) {
    invariant(records, `Unions must be constructed with a \'records\' option.`)
  }

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
