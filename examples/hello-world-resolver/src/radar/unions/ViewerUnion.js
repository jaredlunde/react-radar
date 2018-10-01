import {createUnion} from 'react-radar'
import {Viewer} from '../records'


export default createUnion({
  name: 'ViewerUnion',
  records: {
    viewerA: Viewer,
    viewerB: Viewer
  }
})
