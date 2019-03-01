import {createRecordResolver, fields} from 'react-radar/server'
import Viewer from '../Viewer'


export default createRecordResolver({
  record: Viewer,
  resolves: {
    uid: fields.string,
    name: fields.object({
      first: fields.string,
      last: fields.string
    }),
    numFollowers: fields.int,
    numFollowing: fields.int,
    fishingRod: fields.string
  }
})
