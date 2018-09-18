export default function getKeyField (fields) {
  for (let fieldName in fields) {
    const field = fields[fieldName]

    if (field !== null && field.isRadarKey) {
      return fieldName
    }
  }
}
