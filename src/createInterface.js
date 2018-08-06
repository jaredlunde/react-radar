import {invariant} from './utils'

/**
 * Interface
 * @param  {string} name   the name of the interface (for debugging)
 * @param  {object} fields fields associated with this interface
 * @return {object}        simple object {fields, isRadarInterface}
 */
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
