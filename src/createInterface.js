import {invariant} from './utils'


export default function createInterface ({name, fields}) {
  if (__DEV__) {
    invariant(
      name,
      `Radar Interfaces must include a 'name' option.`
    )

    invariant(
      Object.keys(fields).length,
      `Interface '${name}' must include a 'fields' option.`
    )
  }

  return {fields, isRadarInterface: true}
}
