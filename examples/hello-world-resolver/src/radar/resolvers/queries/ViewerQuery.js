import {ViewerQuery} from '../../queries'
import {ViewerUnionResolver} from '../unions'
import resolver from '../resolver'


export default resolver.resolve({
  query: ViewerQuery,
  resolves: {
    viewer: ViewerUnionResolver.each
  },
  getState: (requires, props, context) => {
    return {
      viewer: [
        {
          viewerA: {
            ...props.viewer,
            uid: 1235,
            name: {
              first: 'phil',
              last: 'donahue'
            }
          }
        },
        {
          viewerB: {
            ...props.viewer,
            uid: 1235,
            name: {
              first: 'phil',
              last: 'donahue'
            }
          }
        },
        {
          viewerA: {
            ...props.viewer,
            uid: 1235,
            name: {
              first: 'phil',
              last: 'donahue'
            }
          }
        }
      ]
    }
  }
})
