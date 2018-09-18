import {createRecord} from 'react-radar'
import User from './User'

export default createRecord({
  name: 'Profile',
  fields: {
    ...User.fields,
    isViewer: null,
  }
})
