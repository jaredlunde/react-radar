import {objectWithoutProps} from '../../utils'
import Records from './Records'
import toImmutable from './toImmutable'
import shouldInvalidate, {childrenDidChange} from './shouldInvalidate'
import deepInvalidate from './deepInvalidate'
import getID from './getID'
import invalidateID, {RADAR_ID_KEY, RADAR_PREV_ID_KEY} from './invalidateID'
import getChildRecords, {RADAR_CHILDREN_KEY} from './getChildRecords'
import emptyObj from 'empty/object'


/**
 * StoreRecord is a MUTABLE class object with its own state
 * @param  {Number|String} key a UNIVERSALLY unique key to identify this record by
 * @constructor
 */
export class StoreRecord {
  constructor (key) {
    this.key = key
    this.state = emptyObj
    // used for tracking sub record invalidations and also just which
    // keys are present in the entire global state (the Store component
    // uses this). should probably populate this to avoid some bugs in
    // tracking which stores listen to what records but I did not.
    this[RADAR_CHILDREN_KEY] = emptyObj
    // used for tracking invalidations
    this[RADAR_ID_KEY] = getID()
  }

  isInvalid () {
    return (
      this[RADAR_ID_KEY] !== this[RADAR_PREV_ID_KEY]
      || childrenDidChange(this[RADAR_CHILDREN_KEY])
    )
  }

  toImmutable () {
    // In our state, sure we  will keep these records. But in the App itself,
    // we will convert to Immutable plain state structures
    if (shouldInvalidate(this)) {
      // an invalidation in a subrecord occurred
      // deep invalidate returns frozen objects so no 'toImmutable' is required
      this.state = deepInvalidate(this.state)
      this[RADAR_CHILDREN_KEY] = getChildRecords(this.state)
    }
    // the state has been successfully invalidated so we can reset the keys
    // in order to not re-invalidate unnecessary
    this[RADAR_PREV_ID_KEY] = this[RADAR_ID_KEY]
    return toImmutable(this.state)
  }

  setState (reducer, nextState, context) {
    // assigns the new state according to a reducer or state object
    nextState = reducer(this.state, nextState, context)

    if (nextState !== null && nextState !== this.state) {
      this.state = nextState
      this[RADAR_CHILDREN_KEY] = getChildRecords(this.state)
      invalidateID(this)
    }
  }

  replaceState (state) {
    this.state = state
    invalidateID(this)
  }
}

StoreRecord.prototype.toJSON = StoreRecord.prototype.toImmutable

const withoutContext = {state: 0, recordType: 0, reducer: 0}

export default context => {
  const
    {state, recordType, reducer} = context,
    key = state[recordType.keyField]
  // no key was found, right now this is kind of just a bailout
  if (key === void 0) return
  context = objectWithoutProps(context, withoutContext)
  context.record = recordType
  // const context = reduceProps(props, ['state', 'recordType', 'reducer'])
  let record = Records.get(key)
  if (record === void 0) {
    // record = StoreRecordFn(key)
    record = new StoreRecord(key)
    // tracks all the records globally
    Records.set(key, record)
  }
  // sets the state of the record
  record.setState(reducer || recordType.reducer, state, context)
  return record
}
