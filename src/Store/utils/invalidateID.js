import getID from './getID'


export const RADAR_ID_KEY = Symbol.for('radar.id')
export const RADAR_PREV_ID_KEY = Symbol.for('radar.prevId')
export default record => {
  record[RADAR_PREV_ID_KEY] = record[RADAR_ID_KEY]
  record[RADAR_ID_KEY] = getID()
}
