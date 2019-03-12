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

let map = new Map()
let obj = {}
bench(() => obj[Math.random()] = Math.random(), 3000)
bench(() => map.set(Math.random(), Math.random()), 3000)
bench(() => obj[Math.random()], 3000)
bench(() => map.get(Math.random()), 3000)
bench(() => delete obj[Math.random()], 3000)
bench(() => map.delete(Math.random()), 3000)

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
