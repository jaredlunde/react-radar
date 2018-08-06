import React from 'react'
import PropTypes from 'prop-types'
import emptyObj from 'empty/object'
import {getEndpointProps} from './utils'


function getNextState (prevState, props) {
  const queryProps = getEndpointProps(
    props.defaultProps,
    prevState,
    props
  )
  const stateKeys = Object.keys(prevState)
  const propKeys = Object.keys(queryProps)

  if (stateKeys.length !== propKeys.length) {
    return queryProps
  }

  for (let x = 0; x < stateKeys.length; x++) {
    const key = stateKeys[x]

    if (prevState[key] !== queryProps[key]) {
      return queryProps
    }
  }

  return null
}


export default class Props extends React.Component {
  static propTypes = {
    defaultProps: PropTypes.object.isRequired
  }

  static defaultProps = {
    defaultProps: emptyObj
  }

  constructor (props) {
    super(props)
    this.state =  getEndpointProps(props.defaultProps, props)
    this.propsContext = {
      setProps: this.setProps
    }
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    return getNextState(prevState, nextProps)
  }

  setProps = props => {
    this.setState(
      (prevState, currentProps) => getNextState(
        prevState,
        props.defaultProps
          ? ({
              ...props,
              defaultProps: {
                ...currentProps.defaultProps,
                ...props.defaultProps
              }
            })
          : ({
              ...props,
              defaultProps: currentProps.defaultProps
            })
      )
    )
  }

  render () {
    this.propsContext.queryProps = this.state
    return this.props.children(this.propsContext)
  }
}
