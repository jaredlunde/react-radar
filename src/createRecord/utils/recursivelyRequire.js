import {unparse} from '../grammar'
import {invariant} from '../../utils'


// !!WARNING!! It's a mind boggler but it works ??
const recursivelyRequire = (shape, allowedFields, field) => {
  if (__DEV__) {
    invariant(
      allowedFields[field.name] !== void 0,
      `${JSON.stringify(shape)} does not contain field: ` +
      `'${field.name}'.`
    )
  }

  if (field.shape === null) {
    shape[field.name] = null
  } else {
    if (shape[field.name] === void 0)
      shape[field.name] = {}
    else if (shape[field.name] === null)
      return shape

    let
      i = 0,
      j = 0

    for (; i < field.shape.length; i++) {
      let allowedField = allowedFields[field.name]

      if (typeof allowedField === 'function') {
        if (allowedField.isRadarRecord) {
          // Found a Radar Record at the key
          const unparsedShape = unparse(field.shape[i])
          allowedField = allowedField([unparsedShape]).fields
        }
        else if (allowedField.isRadarUnion) {
          // Found a Radar Union at the key
          const unions = allowedField
          // Check if current field is a shared field
          if (unions.sharedFields[field.shape[i].name] !== void 0) {
          //if (unions.sharedFields.hasOwnProperty(field.shape[i].name)) {
            const unionKeys = Object.keys(unions.fields)
            for (j = 0; j < unionKeys.length; j++) {
              const
                unionShape = [{
                  name: unionKeys[j],
                  shape: [field.shape[i]]
                }],
                unparsedShape = unparse(unionShape)

              recursivelyRequire(
                shape[field.name],
                allowedField([unparsedShape]).fields,
                unionShape[0]
              )
            }

            // Escape the loop to prevent the next recursivelyRequire call
            continue
          } else {
            const unparsedShape = unparse([field.shape[i]])
            allowedField = allowedField([unparsedShape]).fields
          }
        }
      }

      recursivelyRequire(shape[field.name], allowedField, field.shape[i])
    }
  }

  return shape
}


export default recursivelyRequire
