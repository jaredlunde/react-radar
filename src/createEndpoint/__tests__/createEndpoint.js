function benchEndpoint () {
  const HomeEndpoint = createEndpoint({
    name: 'HomeEndpoint',
    /* Fetch options */
    fetch: {
      url: radarCfg.endpoint,
      timeout: 7000,
    },

    /* Initial properties passed to queries below*/
    initialProps: {
      after: 0
    },

    /** Queries to run on the network*/
    queries: [
      function (props/*would defaul-\t to {after: 0} here*/) {
        return {
          //name: 'MediaQuery',
          type: 'MediaQuery',
          //props,
          params: props,
          //contains: {
          requires: {
            // This is the key passed to the reducer
            // media: MediaContainer.get('media')
            mediaItems: {
              uid: null,
              files: null
            }
          }
        }
      }
    ],

    reducer: function (currentState, {media}) {
      // Whatever this function returns becomes the ENTIRE STATE of the app
      return {media}
    }
  })
}


function benchStore () {
  const HomeEndpoint = createStore({
    name: 'HomeEndpoint',
    /* Fetch options */
    network: {
      endpoint: radarCfg.endpoint,
      timeout: 7000,
    },

    /* Initial properties passed to queries below*/
    initialParams: {
      after: 0
    },

    /** Queries to run on the network*/
    queries: [
      function (props/*would defaul-\t to {after: 0} here*/) {
        return {
          //name: 'MediaQuery',
          type: 'MediaQuery',
          //props,
          params: props,
          //contains: {
          requires: {
            // This is the key passed to the reducer
            // media: MediaContainer.get('media')
            mediaItems: {
              uid: null,
              files: null
            }
          }
        }
      }
    ],

    reducer: function (currentState, {media}) {
      // Whatever this function returns becomes the ENTIRE STATE of the app
      return {media}
    }
  })
}
