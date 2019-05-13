import getChildRecords, {RADAR_CHILDREN_KEY} from './getChildRecords'
import {RADAR_ID_KEY, RADAR_PREV_ID_KEY} from './invalidateID'


export const childrenDidChange = children => {
  let childKeys = Object.keys(children), i = 0
  for (; i < childKeys.length; i++) {
    const prevID = Number(childKeys[i])
    if (prevID !== children[prevID][RADAR_ID_KEY])
      // the record's ID was invalidated at some point
      return true
  }

  return false
}


export default record => {
  if (record[RADAR_PREV_ID_KEY] !== record[RADAR_ID_KEY])
    // next children are lazy loaded here
    return false

  // check children for invalidations
  const didChange = childrenDidChange(record[RADAR_CHILDREN_KEY])

  if (didChange === true)
    record[RADAR_CHILDREN_KEY] = getChildRecords(record.state)

  return didChange
}
