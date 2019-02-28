import memoize from 'trie-memoize'


export default memoize([WeakMap], to => Object.keys(to))
