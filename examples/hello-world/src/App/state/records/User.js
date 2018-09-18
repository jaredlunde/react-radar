import {Key, createRecord} from 'react-radar'
import {dateField} from './fields'


export default createRecord({
  name: 'UserInterface',
  fields: {
    uid: Key(),
    email: null,
    name: {
      first: null,
      last: null,
      middle: null,
      nickname: null,
      suffix: null,
      title: null,
      full: null
    },
    gender: null,
    role: null,
    numItems: null,
    birthday: dateField,
    joinedOn: dateField
  }
})
