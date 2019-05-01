let invariant_ = null

if (__DEV__) {
  const invariant = require('invariant')

  invariant_ = (truthyFalsey, message, warning) => {
    const msg = `${message} See https://radarjs.com/docs for detailed ` +
      `documentation and examples.`

    if (warning === true && !truthyFalsey)
       console.warn(msg)
    else
      invariant(truthyFalsey, msg)
  }
}
else {
  invariant_ = () => {}
}

export default invariant_
