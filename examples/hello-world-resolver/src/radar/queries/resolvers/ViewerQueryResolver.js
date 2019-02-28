import {ViewerQuery} from '../../queries'
import {ViewerResolver} from '../../records/resolvers'
import resolver from '../../resolver'


export default resolver.resolve({
  query: ViewerQuery,
  resolves: {
    viewer: ViewerResolver.each
  },
  getState: (requires, props, context) => {
    return {
      viewer: [
        {
          ...props.viewer,
          uid: 1235,
          name: {
            first: 'phil',
            last: 'donahue'
          },
          numFollowing: 12,
          numFollowers: 120,
          fishingRod: 'foo'
        }
      ]
    }
  }
})
