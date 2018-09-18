import {createRecord, Key} from 'react-radar'


export default createRecord({
  name: 'ItemType',
  fields: {
    uid: Key(),
    name: null,
    price: null,
    description: null
  }
})
