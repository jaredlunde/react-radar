<h1 align=center>
  `react-radar`
</h1>
<pre align=center>
  yarn add react-radar
</pre>


```js
// hello-world.js
import Radar from 'react-radar'


const Viewer = Radar.createRecord({
  name: 'Viewer',
  field: {
    uid: Radar.Key(),
    username: null,
    lastSeen: v => new Date(val),
    joinedOn: v => new Date(val)
  }
})

const GetViewer = Radar.createQuery({
  name: 'GetViewer',
  requires: props => ({viewer: Viewer`username`})
})


export default function App (props) {
  return (
    <Radar.Store
      cache={Radar.createCache()}
      network={Radar.createNetwork({url: 'https://radar-app.com/radar'})}
    >
      <Radar.Query connect='viewer' run={GetViewer()}>
        {({viewer}, radar) =>
          radar.statusText === 'loading'
            ? 'Loading...'
            : radar.statusText === 'error'
              ? <button onClick={radar.reload}>Try again?</button>
              : `Hello ${viewer.username}`}
      </Radar.Query>
    </Radar.Store>
  )
}
```

--------
--------
