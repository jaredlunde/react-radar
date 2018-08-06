import {invariant} from '../utils'


const emptyObj = {}
export default function createRecordMutation ({
  queries,
  defaultProps = emptyObj,
  reducer,
}) {
  if (__DEV__) {
    invariant(
      queries && queries.length > 0,
      'Record Mutations must include queries.'
    )
  }

  return function RecordMutation (props) {
    return {
      queryProps: Object.assign({}, defaultProps, props),
      queries,
      reducer,
      isRadarRecordMutation: true
    }
  }
}
