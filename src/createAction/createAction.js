import {invariant} from '../utils'
import defaultReducer from '../createEndpoint/defaultReducer'


const emptyObj = {}
export default function createAction ({
  queries,
  defaultProps = emptyObj,
  reducer = defaultReducer
}) {
  invariant(
    queries && queries.length > 0,
    'Actions must include queries.'
  )

  return function Action (props) {
    return {
      queryProps: {...defaultProps, ...props},
      queries,
      reducer,
      isRadarAction: true
    }
  }
}
