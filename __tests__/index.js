//Uses:
//  https://github.com/rtfeldman/seamless-immutable

const MediaContainer = Radar.createContainer({
  /** elements passed through the node get registered to all changes to other
      nodes containing the same @key
  */
  media: () => MediaNode`
    uid
    caption
    platform
    numLikes
    numViews
    owner {
      username
      isViewer
      avatar
    }
    files {
      picture {
        bucket
        key
        width
        height
        tags
        mime
      }
      video {
        bucket
        key
        width
        height
        duration
        tags
        mime
      }
    }
    viewerDoesLike
  `,
  viewer: () => ViewerNode`
    uid
    username
    avatar
  `
})


const MediaNode = Radar.createNode({
  name: 'Media', // For debugging
  fields: {
    uid: Radar.Key(string), // UNIVERSALLY UNIQUE key
    caption: null,
    owner: ProfileNode,
    platform: null,
    files: MediaFileUnion,
    uploadedOn: momentField,
    viewerDoesLike: null,
    viewerIsOwner: null,
    numLikes: null,
    numViews: null,
    numComments: null,
    numPublicChannels: null,
    numPrivateChannels: null,
    numPornstars: null,
    numReactions: null,
  },
  // Initial/default state of the node
  initialState: {},
  // Whenever nodes are received from the server they go through this reducer
  // The node updated is based on the key field of that node
  reducer: function (
    currentState,/*Current GLOBAL state of the node @ current key*/
    updatedState/*The new state being proposed via some mutation*/
  ) {
    // this is the default
    const suggestedState = Immutable.merge(currentState, updatedState, {deep: true})
    return isEqual(currentState, suggestedState) ? currentState : suggestedState
  }
})


function createBasicQuery(name) {
  const Query = function ({props, contains}) {
    return {name, props, contains}
  }

  Object.defineProperty(Query, 'name', {value: name})
  return Query
}


function queryMedia ({props, contains}) {
  return {
    name: 'MediaQuery'
    props,  // easy to switch 'params' to 'props' in radar resolver
    contains  // easy to switch 'requires' to 'contains' in radar resolver
  }
}

function editMedia ({props, contains}) {
  return {
    name: 'EditMedia'
    props,  // easy to switch 'params' to 'props' in radar resolver
    contains  // easy to switch 'requires' to 'contains' in radar resolver
  }
}


// Queries and actions === same thing
// Nodes decide what to do with the payload received from each query/actions
// via their reducers.
const MediaNetwork = Radar.createNetwork({
  endpoint: radar.endpoint,
  timeout: radar.timeout,

  /* Initial properties passed to queries below*/
  initialProps: {
    after: 0
  },

  /** Queries to run on the network*/
  queries: [
    function (props/*would default to {after: 0} here*/) {
      return queryMedia({
        props,
        contains: {
          // This is the key passed to the reducer
          media: MediaContainer.get('media')
        }
      })
    }
  ],

  reducer: function (currentState, {media}) {
    // Whatever this function returns becomes the ENTIRE STATE of the app
    return {media}
  }
})


function mediaPageReducer ({media, viewer/**Global state*/}) {
  // 'media' will be passed through the 'media' node in Container
  // 'viewer' will be passed through the 'viewer' node in Container
  return {media, viewer}
}


const changeTitle = Radar.createAction({
  /** Query parameters to send over the network*/
  props: ({/**props*/uid, newTitle}) => ({uid, title: newTitle}),
  /** Query sent to the network */
  query: function (props) {
    return editMedia({
      props,
      contains: {
        // This is the key passed to the reducer
        item: MediaContainer.get('media')
      }
    })
  },
  /** Mutates the state based on data returned by the network*/
  reducer: function (
    props,
    {media, viewer}/*currentState from store*/,
    {item}/*returned by server, from query[contains]*/
  ) {
    // Whatever this function returns becomes the ENTIRE STATE of the app
    media = Immutable.merge(media, item)
    return {media, viewer}
  }
})


<MediaNetwork uid='abELblzblWdd'>
  {function ({radar, network}) {
    switch (network.status) {
      case 'LOADING':
        return 'Loading...'
      case 'FAILED':
        return (
          <div>
            Failed [{network.request.status_code}]

            <button onClick={radar.refresh}>
              Try again
            </button>
          </div>
        )
      case 'SUCCESS':
        // Subscribes to media and viewer changes on the fields mentioned above
        return (
          <MediaContainer reducer={mediaPageReducer/*Must return nodes {media, viewer}*/}>
            {function ({radar, media, viewer}) {
              const optimisticUpdate = radar.commitLocal({foo: 'bar'})
              // Persist to network
              optimisticUpdate.persist()

            }}
          </MediaContainer>
        )
    }
  }}
</MediaNetwork>
