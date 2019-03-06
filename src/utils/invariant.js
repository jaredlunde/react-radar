let invariant_ = null

if (__DEV__) {
  const invariant = require('invariant')

  invariant_ = (truthyFalsey, message, warning) => {
    if (__DEV__) {
      const msg = `${message} See https://radarjs.com/docs for detailed ` +
                  `documentation and examples.`

      if (warning === true) {
        if (!truthyFalsey) {
          console.warn(msg)
        }
      } else {
        invariant(truthyFalsey, msg)
      }
    }
  }
}
else {
  invariant_ = () => {}
}

export default invariant_
