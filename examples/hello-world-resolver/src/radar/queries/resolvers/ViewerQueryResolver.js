import {ViewerQuery} from '../../queries'
import {ViewerResolver} from '../../records/resolvers'
import resolver from '../../resolver'


export default resolver.resolve({
  query: ViewerQuery,
  resolves: {
    viewer: ViewerResolver.each
  },
  getState: (requires, props, context) => ({
    viewer: [
      {
        ...props.viewer,
        uid: 13,
        name: {
          first: 'George',
          last: 'Donahue'
        },
        numFollowing: 2,
        numFollowers: "12222330",
        fishingRod: 'Jared, the resolver worked!'
      }
    ]
  })
})
