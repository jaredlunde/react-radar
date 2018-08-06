import React from 'react'
import {invariant} from '../utils'
import RadarConsumer from '../createEndpoint/EndpointConsumer'
import defaultReducer from './defaultReducer'


export default function createTemplate ({record}) {
  const record_ = record()
  const fieldKeys = Object.keys(record_.containsFields || record_.fields)

  // @withRadar: if true, template props will include Radar context object
  function Template ({children, withRadar = false, ...props}) {
    // only checks for required fields in 'development' mode
    if (__DEV__) {
      for (let x = 0; x < fieldKeys.length; x++) {
        const fieldKey = fieldKeys[x]
        invariant(
          props.hasOwnProperty(fieldKey) === true,
          `Template for '${record.name}' missing field: '${fieldKey}'.`
        )
      }
    }

    return (
      withRadar === true
      ? <RadarConsumer children={radar => children(Object.assign({radar}, props))}/>
      : children(props)
    )
  }

  if (__DEV__) {
    invariant(
      typeof record === 'function',
      `Argument 'record' in 'createTemplate' must be a function. Did you forget ` +
      `to wrap your record in a function?`
    )

    Template.displayName = `Template({${fieldKeys.join(', ')})}`
  }

  Template.get = record.bind(record)
  // allows direct embedding into tagged templates
  Template.toString = function () {
    return record_.toString()
  }

  return Template
}
