import getID from './getID'


export const RADAR_ID_KEY = '__@@RADAR_ID@@__'
export const RADAR_PREV_ID_KEY = '__@@RADAR_ID_OLD@@__'


export default function invalidateID (record) {
  record[RADAR_PREV_ID_KEY] = record[RADAR_ID_KEY]
  record[RADAR_ID_KEY] = getID()
}
