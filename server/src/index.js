/*
import {
  createRecordResolver,
  createResolver,
  fields
} from 'react-radar/resolver'

const pwaResolver = createResolver()

const ViewerResolver = createRecordResolver({
  record: Viewer,
  resolves: {
    uid: fields.Key(fields.string),
    username: fields.string,
    numFollowers: fields.int,
    numFollowing: fields.int
  }
})

pwaResolver.resolve({
  query: ViewerQuery,
  resolves: {
    viewer: ViewerResolver,
    viewers: ViewerResolver.each,
  },
  getState: (props, requires, context) => {
    return {
      viewer: context.req.session.viewer,
      viewers: [context.req.session.viewer]
    }
  }
})
*/
export * from './fields'
export * as fields from './fields'
export createQueryResolver from './createQueryResolver'
export createRecordResolver from './createRecordResolver'
export createResolver from './createResolver'
export createUnionResolver from './createUnionResolver'
