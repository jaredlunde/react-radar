export default function (fields) {
  for (let fieldName in fields) {
    const field = fields[fieldName]

    if (field !== null && field.isRadarKey) {
      return fieldName
    }
  }
}
