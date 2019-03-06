import {deepIntersection} from '../../utils'


export default records => {
  const recs = []

  for (let name in records) {
    const record = records[name]
    recs.push(record.fields)
  }

  return deepIntersection(...recs)
}
