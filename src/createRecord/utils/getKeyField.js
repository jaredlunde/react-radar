export default fields => {
  const fieldNames = Object.keys(fields)

  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i]
    const field = fields[fieldName]

    if (field !== null && field.isRadarKey) {
      return fieldName
    }
  }
}
