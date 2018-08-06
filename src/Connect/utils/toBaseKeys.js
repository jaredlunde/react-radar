import memoize from 'weakmap-memoize'


const wm = new WeakMap()
export default memoize(wm, to => Object.keys(to))
