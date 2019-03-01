import {ViewerQuery} from '../../queries'
import {ViewerResolver} from '../../records/resolvers'
import resolver from '../../resolver'


export default resolver.resolve({
  query: ViewerQuery,
  resolves: {
    viewer: ViewerResolver
  },
  getState: (requires, props, context) => ({
    viewer: {
      ...props.viewer,
      uid: props.uid || Math.random(),
      name: {
        first: 'Phil',
        last: 'Donahue'
      },
      numFollowing: null,
      numFollowers: "12330",
      fishingRod: 'Jared, the resolver worked. Again!'
    }
  })
})
