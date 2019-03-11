const now = typeof window !== 'undefined' ? performance.now.bind(performance) : require('performance-now')

const bench = (fn, time = 1000, opt = {}) => {
  const {before, after} = opt
  let elapsed = 0.0, iterations = 0

  while (elapsed < time) {
    if (before) {
      before()
    }

    const start = now()
    fn()
    elapsed += now() - start

    if (after) {
      after()
    }

    iterations++
  }

  console.log('------------------------------------')
  console.log('%cFunction', 'font-weight: 700', fn)
  console.log(
    '%cIterations/s:', 'font-weight: 700; color: green',
    1000.0 / (elapsed / iterations)
  )
}


const {CDLL} = require('cdll-memoize')
let initial = []
for (let i = 0; i < 1000; i++) {
  initial.push(i)
}
let cdll = new CDLL(initial)
let set = new Set(initial)
let noop = v => v

bench(() => new CDLL(initial), 3000)
bench(() => new Set(initial), 3000)
bench(() => cdll.forEach(noop), 3000)
bench(() => set.forEach(noop), 3000)
bench(() => cdll.find(500), 3000)
bench(() => set.has(500), 3000)
bench(() => {
  for (let v of set) {
    noop(v)
  }
}, 3000)

const objA = {
  foo: { bar: 3 },
  array: [{
    does: 'work',
    too: [ 1, 2, 3 ]
  }]
}
const objB = {
  foo: { baz: 4 },
  quux: 5,
  array: [{
    does: 'work',
    too: [ 4, 5, 6 ]
  }, {
    really: 'yes'
  }]
}
bench(
  function () {
    deepMerge(objA, objB, {arrayMerge: arrayMergeReplace})
  },
  400000
)
bench(
  function () {
    merge(objA, objB)
  },
  400000
)
console.log(deepMerge(objA, objB))
