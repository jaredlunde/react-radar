export default fields => {
  let fieldNames = Object.keys(fields), i = 0
  for (; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i], field = fields[fieldName]
    if (field !== null && field.isRadarKey)
      return fieldName
  }
}
