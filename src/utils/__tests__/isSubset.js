let testObj1 = {foo: 'bar', boz: 'baz'}
let testObj2 = {foo: 'bar', boz: 'baz'}
console.log('\nTest -> equal objects')
benchmark(() => isSubset1(testObj1, testObj2), 5000000)
benchmark(() => isSubset2(testObj1, testObj2), 5000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))

console.log('\nTest -> same objects')
benchmark(() => isSubset1(testObj1, testObj1), 5000000)
benchmark(() => isSubset2(testObj1, testObj1), 5000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj1))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj1))

console.log('\nTest -> potentially equal moment')
testObj1 = {foo: 'bar', boz: moment(new Date())}
testObj2 = {foo: 'bar', boz: moment(new Date())}
benchmark(() => isSubset1(testObj1, testObj2), 10000)
benchmark(() => isSubset2(testObj1, testObj2), 1000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))

console.log('\nTest -> unambiguously unequal moment')
testObj1 = {foo: 'bar', boz: moment(new Date())}
testObj2 = {foo: 'bar', boz: moment(new Date()).add(1, 'days')}
benchmark(() => isSubset1(testObj1, testObj2), 10000)
benchmark(() => isSubset2(testObj1, testObj2), 1000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))

console.log('\nTest -> equal moment')
let now = new Date()
testObj1 = {foo: 'bar', boz: moment(now)}
testObj2 = {foo: 'bar', boz: moment(now)}
benchmark(() => isSubset1(testObj1, testObj2), 10000)
benchmark(() => isSubset2(testObj1, testObj2), 1000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))

console.log('\nTest -> potentially equal date')
testObj1 = {foo: 'bar', boz: new Date()}
testObj2 = {foo: 'bar', boz: new Date()}
benchmark(() => isSubset1(testObj1, testObj2), 10000)
benchmark(() => isSubset2(testObj1, testObj2), 1000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))

console.log('\nTest -> same date')
now = new Date()
testObj1 = {foo: 'bar', boz: now}
testObj2 = {foo: 'bar', boz: now}
benchmark(() => isSubset1(testObj1, testObj2), 10000)
benchmark(() => isSubset2(testObj1, testObj2), 1000000)
console.log('isSubset1 answer:', isSubset1(testObj1, testObj2))
console.log('isSubset2 answer:', isSubset2(testObj1, testObj2))
