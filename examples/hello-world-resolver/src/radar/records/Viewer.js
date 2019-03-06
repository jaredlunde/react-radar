import {createRecord, Key} from 'react-radar'


export default createRecord({
  fields: {
    uid: Key(),
    name: {
      first: null,
      last: null
    },
    numFollowers: null,
    numFollowing: null,
    fishingRod: null
  }
})
