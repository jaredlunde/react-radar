import {createUnionResolver, fields} from 'react-radar/resolver'
import {ViewerUnion} from '../../unions'
import {ViewerResolver} from '../records'


export default createUnionResolver({
  union: ViewerUnion,
  resolves: {
    viewerA: ViewerResolver,
    viewerB: ViewerResolver,
  }
})
