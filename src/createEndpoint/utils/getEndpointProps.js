import emptyObj from 'empty/object'


export default function getEndpointProps (
  defaultProps = emptyObj,
  prevState = emptyObj,
  props = emptyObj
) {
  const outProps = {...defaultProps}
  const stateNames = Object.keys(prevState)
  const propNames = Object.keys(props)
  let i

  for (i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    outProps.hasOwnProperty(propName) && (outProps[propName] = props[propName])
  }

  for (i = 0; i < stateNames.length; i++) {
    const propName = stateNames[i]
    outProps.hasOwnProperty(propName) && (outProps[propName] = props[propName])
  }

  return outProps
}
