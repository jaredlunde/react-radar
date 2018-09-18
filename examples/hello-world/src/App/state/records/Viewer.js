import {createRecord} from 'react-radar'
import User from './User'

export default createRecord({
  name: 'AdminViewer',
  fields: {
    ...User.fields,
    activated: null,
    settings: {
      locale: null,
    }
  }
})
