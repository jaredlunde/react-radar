import {deepIntersection} from '../../utils'


export default function (records) {
  const recs = []

  for (let name in records) {
    const record = records[name]
    recs.push(record.fields)
  }

  return deepIntersection(...recs)
}
