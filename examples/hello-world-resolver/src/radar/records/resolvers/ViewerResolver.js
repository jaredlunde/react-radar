import {createRecordResolver, fields} from 'react-radar/server'
import Viewer from '../Viewer'


export default createRecordResolver({
  record: Viewer,
  resolves: {
    uid: fields.string,
    name: fields.mapping({
      first: fields.string,
      last: fields.string
    }),
    numFollowers: fields.integer,
    numFollowing: fields.integer,
    fishingRod: fields.string
  }
})
