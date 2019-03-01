import {createUnionResolver, fields} from 'react-radar/server'
import {ViewerResolver} from '../../records'
import ViewerUnion from '../ViewerUnion'


export default createUnionResolver({
  union: ViewerUnion,
  resolves: {
    viewerA: ViewerResolver,
    viewerB: ViewerResolver,
  }
})
