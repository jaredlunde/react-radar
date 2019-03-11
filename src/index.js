import Connect from './Connect'
import createNetwork from './createNetwork'
import createQuery, {createReducer, defaultReducer, noop} from './createQuery'
import createRecord from './createRecord'
import createRecordUpdate from './createRecordUpdate'
import createUnion from './createUnion'
import load from './load'
import Key from './Key'
import Query from './Query'
import Store, {createCache, RadarConsumer} from './Store'
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
  defaultReducer,
  noop,
  createRecord,
  createRecordUpdate,
  createUnion,
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
  defaultReducer,
  noop,
  createRecord,
  createRecordUpdate,
  createUnion,
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
