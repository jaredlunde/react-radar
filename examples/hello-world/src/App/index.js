import React from 'react'
import {
  Store,
  Query,
  Updater,
  Connect,
  createQuery,
  createNetwork
} from 'react-radar'
import {Viewer} from './state/records'


const ViewerQuery = createQuery({
  name: 'ViewerQuery',
  requires: () => ({viewer: Viewer``})
})

const ViewerQuery2 = createQuery({
  name: 'ViewerQuery',
  getOptimistic: () => ({viewer: {uid: 129343, name: {first: 'Jared'}}}),
  getRollback: () => ({viewer: null}),
  requires: () => ({viewer: Viewer``})
})


export default class App extends React.PureComponent {
  state = {name: null}

  render () {
    return (
      <Store
        cache={this.props.cache}
        network={createNetwork({url: 'http://127.0.0.1:4000/1.0/radar'})}
      >
        <div style={{width: '100%'}}>
          <Updater connect='viewer' run={ViewerQuery2()}>
            {({viewer, errors}, radar) => viewer === null && (
              <div style={{marginBottom: 32}}>
                <button onClick={radar.commit}>
                  {radar.status === Updater.LOADING ? 'Loading...' : radar.status === Updater.ERROR ? 'Try again?' : 'Load viewer'}
                </button>
              </div>
            )}
          </Updater>

          <Query connect='viewer' run={[ViewerQuery()]}>
            {({viewer}, radar) => {
              // console.log(JSON.stringify(radar, null, 2))
              switch (radar.status) {
                case Query.ERROR:
                  return (
                    <>
                      Error - <button onClick={radar.reload}>Retry</button>
                    </>
                  )
                case Query.WAITING:
                case Query.LOADING:
                  return 'Loading...'
                default:
                  return (
                    <>
                      1. Yo, {viewer && viewer.name.first} - <button onClick={radar.reload}>Reload</button>
                      <Query connect='viewer' run={[ViewerQuery({test: 'crepe'}), ViewerQuery()]}>
                        {({viewer, errors}, radar) => {
                          // console.log(JSON.stringify(radar, null, 2))
                          switch (radar.status) {
                            case Query.ERROR:
                              return (
                                <>
                                  Error - <button onClick={radar.reload}>Retry</button>
                                </>
                              )
                            break;
                            case Query.WAITING:
                            case Query.LOADING:
                              return 'Loading...'
                            break;
                            default:
                              return (
                                <>
                                  2. Yo, {viewer && viewer.name.first} - <button onClick={radar.reload}>Reload</button>
                                </>
                              )
                          }
                        }}
                      </Query>
                    </>
                  )
              }
            }}
          </Query>

          <Query parallel connect='viewer' run={[ViewerQuery({test: 'pollish'}), ViewerQuery()]} forceReload>
            {({viewer}, radar) => {
              // console.log(JSON.stringify(radar, null, 2))
              switch (radar.status) {
                case Query.ERROR:
                  return (
                    <>
                      Error - <button onClick={radar.reload}>Retry</button>
                    </>
                  )
                case Query.WAITING:
                case Query.LOADING:
                  return 'Loading...'
                default:
                  return (
                    <>
                      3. Yo, {viewer && viewer.name.first} - <button onClick={radar.reload}>Reload</button>
                    </>
                  )
              }
            }}
          </Query>

          <Connect to='viewer'>
            {({viewer}) => (
              <pre>{JSON.stringify(viewer, null, 2)}</pre>
            )}
          </Connect>
        </div>
      </Store>
    )
  }
}
