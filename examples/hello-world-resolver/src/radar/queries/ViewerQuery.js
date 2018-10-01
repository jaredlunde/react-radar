import {createQuery} from 'react-radar'
import {Viewer} from '../records'
import {ViewerUnion} from '../unions'

export default createQuery({
  name: 'ViewerQuery',
  requires: () => ViewerUnion`
    viewerA {
      ${Viewer``}
    }
    viewerB {
      ${Viewer``}
    }
  `
})
