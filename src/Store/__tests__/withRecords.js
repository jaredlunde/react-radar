const running = false

if (endpoint.response.json && !running) {
  console.log('[Bench] withRecords --> mediaItems')

  async function runBench () {
    running = true
    let r = await endpoint.response.json()
    const query = props => ({
      //name: 'MediaQuery',
      type: 'MediaQuery',
      //props,
      params: props,
      //contains: {
      requires: {
        // This is the key passed to the reducer
        // media: MediaContainer.get('media')
        mediaItems: MediaRecord`uid files`
      }
    })
    r[0].mediaItems = r[0].mediaItems.splice(0, 1)
    console.log("HERE", r)
    benchmark(() => withRecords({nextState: r, store: this, queries: [query], queryProps: {after: 10}}), 100)
  }

  runBench().then(console.log)
}
