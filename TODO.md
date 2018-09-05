# TODO
- Allow for pre-fetching
  - Radar.prefetch(HomeEndpoint, props)
    - Would have to store the state somewhere, have clarity as to whether or not
      the correct endpoint/data was loaded
- Allow for idiomatic parallel fetching

```js
import Radar from 'react-radar'


export default function App (props) {
  return (
    <Radar.Provider>
      <Home>
        <Radar.Pipeline uid={you} queries={[ViewerQuery, ProfileQuery]}>
          {(profile, viewer, radar) => (
            <div>
              Hello {profile.username}
              <button onClick={radar.reload}>
                Reload
              </button>
            </div>
          )}
        </Radar.Pipeline>

        <Radar.Action connect='profile' defer={FollowAction}>
          {({profile}, {commit}) => (
            <Button onClick={() => commit({})}>
              Follow me
            </Button>
          )}
        </Radar.Action>

        <Radar.Connect to='profile'>

        </Radar>
      </Home>
    </Radar.Provider>
  )
}

```
