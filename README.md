<p align=center>
  <img src='/dist/radar.svg' width=200/>
</p>

--------

<h1 align=center>
  Radar (codename Radux)
</h1>
<pre align=center>
  yarn add react-radar
</pre>

--------

An easy, declarative way to manage network-backed global state in React
applications.

- Update once, update everywhere
- Only fetch the fields you need
- Stringently immutable (using seamless-immutable)
- Typed (optionally), predictable records-only state model
- Top-down data flow
- Managed by reducers
- Function as Child Component pattern (similar to Render Props)
- Under 100kb (under 30kb gzipped) after polyfills for Fetch, Map, WeakMap and Set

--------

### State endpoints
- createEndpoint
  - Networking
  - Props
  - Store
  - Endpoint
  - Provider
  - Consumer

### State records
- createRecord
  - Key
- createInterface
- createUnion

### State mutations
- createAction
- createRecordMutation

### State -> Component connections
- createConnection
- createTemplate

--------

### createRecord
```js
createRecord({
  name: 'string',
  implement: [],
  fields: {},
  initialState: {},
  reducer: function (prevState, nextState, context) {}
})
```
- `@name`: the unique name of the record. This is useful within `context` of the
  reducer during record mutations when multiple types of records are getting
  mutated in one go.
- `@implement`: an array of interfaces (see: createInterface) to inherit
  into this record type
- `@fields`: an object containing `{fieldName: (field cast, sub record, or union)}`
  pairs. This is the data structure of this record. No fields aside from those
  declared here will be allowed entrance into the state. Fields can respond with
  single values or arrays when they are requested from the network. Each
  set of fields must contain a Key field (see: Key) which must be UNIVERSALLY
  unique to the set of records. This key is used to ensure that a change to
  a record reflects itself in the entire application.
- `@initialState`: the initial state of the record
- `@reducer`: a function which decides what to do with the state it receives
  from the network. The default reducer deep merges newly received data into
  the record. The object returned by this function will become the ENTIRE
  state of the record and you must be sure to enforce immutability when
  making updates. If you intend for the application to respond to changes
  to the record, the object returned here must be different than prevState.
  You cannot just append values to prevState. It MUST be an entirely new
  object.


--------


### Key
```js
{id: Key(cast)}
```
- `@cast` optional function to cast the value with in the store


--------

### createInterface
```js
const Interface = createInterface({
  name: 'string',
  fields: {}
})
```
This is just a convenient way to inherit fields across record types
```js
const RecordA = createRecord({
  implement: [Interface],
  fields: {
    unsharedFooA: null
  }
})

const RecordB = createRecord({
  implement: [Interface],
  fields: {
    unsharedFooB: null
  }
})
```


--------


### createConnection
```js
createConnection({
  stateKey: Record`id foo bar`
})
```


#### methods
- `get`
