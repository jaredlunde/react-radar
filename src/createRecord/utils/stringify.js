import memoize from 'trie-memoize'
import {trim} from '../grammar'
import {isPlainObject} from '../../utils'


const stringify = memoize(
  [Map],
  fields => {
    let out = ''
    const keys = Object.keys(fields).sort()

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const val = fields[key]

      if (isPlainObject(val) && !val.isRadarKey) {
        out += ` ${key}{${stringify(val)}}`
      } else {
        out += ` ${key}`
      }
    }

    return out.replace(trim, '')
  }
)

export default stringify
