import {createQuery} from 'react-radar'
import {Viewer} from '../records'

export default createQuery({
  name: 'ViewerQuery',
  requires: () => Viewer``
})
