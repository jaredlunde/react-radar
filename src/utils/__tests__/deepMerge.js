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
benchmark(
  function () {
    deepMerge(objA, objB, {arrayMerge: arrayMergeReplace})
  },
  400000
)
benchmark(
  function () {
    merge(objA, objB)
  },
  400000
)
console.log(deepMerge(objA, objB))
