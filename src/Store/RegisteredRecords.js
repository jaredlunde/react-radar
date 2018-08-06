import Records from './Records'
import {getRecordKeys, diffKeys} from './utils'


const shouldDelete = new Set()
export const RegisteredRecords = new Map()

const Handler = {
  register: function (store, key) {
    // registers a store to a given key
    const stores = RegisteredRecords.get(key) || new Set()
    stores.add(store)
    RegisteredRecords.set(key, stores)
  },

  unregister: function (store, key) {
    // unregisters a store at a given key
    const stores = RegisteredRecords.get(key) || new Set()
    stores.delete(store)

    if (stores.size === 0) {
      RegisteredRecords.delete(key)
      shouldDelete.add(key)
    }
  },

  diffUnregister: function (store, prevState, nextState) {
    // unregisters keys that are no longer listened to by the store
    return new Promise(
      function (resolve) {
        const diff = diffKeys(getRecordKeys(prevState), getRecordKeys(nextState))

        for (let x = 0; x < diff.length; x++) {
          Handler.unregister(store, diff[x])
        }

        resolve()
      }
    )
  },

  disposeStore: function (store) {
    // cleans up store records after the store unmounts
    return new Promise(
      function (resolve) {
        const storeKeys = getRecordKeys(store.state)
        // console.log('[RegisteredRecords] stale keys:', storeKeys)
        for (let x = 0; x < storeKeys.length; x++) {
          const key = storeKeys[x]
          Handler.unregister(store, key)
        }

        Handler.collect()
        resolve()
      }
    )
  },

  invalidateStoresByKey: function (key, ignore) {
    // invalidates stores whose keys have updated
    const stores = RegisteredRecords.get(key) || new Set()

    for (let store of stores) {
      if (ignore.indexOf(store) === -1) {
        store.invalidate()
      }
    }
  },

  collect  () {
    // asynchronously rids the registered records map of stale records
    return new Promise(
      function (resolve) {
        for (let key of shouldDelete) {
          const stores = RegisteredRecords.get(key)

          if (!stores || stores.size === 0) {
            Records.delete(key)
            RegisteredRecords.delete(key)
          }

          shouldDelete.delete(key)
        }

        resolve()
      }
    )
  }
}


export default Handler
