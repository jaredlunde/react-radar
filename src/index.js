import Connect from './Connect'
import createNetwork from './createNetwork'
import createQuery, {createReducer, noop} from './createQuery'
import createRecord from './createRecord'
import createRecordUpdate from './createRecordUpdate'
import load from './load'
import Key from './Key'
import Query from './Query'
import Store, {createCache, EndpointConsumer as RadarConsumer} from './Store'
import Updater from './Updater'
import withRadar from './withRadar'

// reducer utils
import {
  isSubset,
  deepMerge,
  mergeIfMergeable,
  arrayMergeOverwrite,
  arrayMergeConcat,
  arrayMergeReplace
} from './utils'

export {
  Connect,
  createNetwork,
  createQuery,
  createReducer,
  noop,
  createRecord,
  createRecordUpdate,
  load,
  Key,
  Query,
  Store,
  createCache,
  RadarConsumer,
  Updater,
  withRadar,
  // reducer utils
  isSubset,
  deepMerge,
  mergeIfMergeable,
  arrayMergeOverwrite,
  arrayMergeConcat,
  arrayMergeReplace
}

export default {
  Connect,
  createNetwork,
  createQuery,
  createReducer,
  noop,
  createRecord,
  createRecordUpdate,
  load,
  Key,
  Query,
  Store,
  createCache,
  RadarConsumer,
  Updater,
  withRadar,
  // reducer utils
  isSubset,
  deepMerge,
  mergeIfMergeable,
  arrayMergeOverwrite,
  arrayMergeConcat,
  arrayMergeReplace
}
