const unparseShape = (shape, inputParams) => {
  if (shape === null) return '';

  return `{${unparseFields(shape, inputParams)}}`
}

const unparseField = (field, inputParams) => {
  return ` ${field.name}${unparseShape(field.shape, inputParams)}`
}

const unparseFields = (fields, inputParams) => {
  let str = ''

  for (let i = 0; i < fields.length; i++) {
    str += unparseField(fields[i], inputParams)
  }

  return str.trim()
}

export default unparseFields
