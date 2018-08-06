const BBBRecord = createRecord({
  name: 'BBB',
  fields: {
    uid: Key(),
    crips: null,
    dips: null,
  }
})

const BarRecord = createRecord({
  name: 'Bar',
  fields: {
    uid: Key(),
    crips: null,
    dips: null,
    cringo: {
      crongo: BBBRecord
    }
  }
})


const BazRecord = createRecord({
  name: 'baz',
  fields: {
    uid: Key(),
    crops: null,
    dops: null,
    cringo: {
      crongo: BBBRecord
    }
  }
})


const BozRecord = createRecord({
  name: 'boz',
  fields: {
    uid: Key(),
    crops: null,
    dops: null,
    cringo: {
      fringo: null,
      crongo: BBBRecord
    }
  }
})


const WhichUnion = createUnion({
  name: 'WhichUnion',
  records: {
    bar: BarRecord,
    baz: BazRecord,
    boz: BozRecord
  }
})


const FooRecord = createRecord({
  name: 'Foo',
  fields: {
    uid: Key(),
    foo: BozRecord,
    which: WhichUnion
  }
})


let Foo = FooRecord`
  foo {crops}
  uid
  which {
    cringo
    uid
    bar {
      dips
    }
  }
`
console.log('Foo fields:', Foo.fields)

Foo = FooRecord`
  foo {crops}
  uid
  which {
    bar {
      dips
    }
  }
`
console.log('Foo fields 2:', Foo.fields)

Foo = FooRecord`
  foo {crops}
  uid
  which
`
console.log('Foo fields 3:', Foo.fields)

Foo = FooRecord`
  foo {crops}
  uid
  which {bar boz{uid}}
`
console.log('Foo fields 4:', Foo.fields)

Foo = FooRecord`
  foo {crops}
  uid
  which {cringo bar boz{uid}}
`
console.log('Foo fields 5:', Foo.fields)
