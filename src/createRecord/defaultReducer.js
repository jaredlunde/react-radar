import {deepMerge, arrayMergeReplace} from '../utils'
import isSubset from '../utils/isSubset'


export default function (
  prevState, /*Current GLOBAL state of the node @ current key*/
  nextState  /*The new state being proposed via some mutation*/
) {
  if (isSubset(prevState, nextState)) {
    return prevState
  }

  return deepMerge(prevState, nextState, {arrayMerge: arrayMergeReplace})
}
