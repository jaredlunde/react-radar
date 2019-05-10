import memoize from 'trie-memoize'
import {trim} from '../grammar'
import {isPlainObject} from '../../utils'


const stringify = memoize(
  [Map],
  fields => {
    let
      out = '',
      i = 0,
      keys = Object.keys(fields).sort()

    for (; i < keys.length; i++) {
      const
        key = keys[i],
        val = fields[key]

      out +=
        isPlainObject(val) === true && val.isRadarKey !== true
          ? ` ${key}{${stringify(val)}}`
          : out += ` ${key}`
    }

    return out.replace(trim, '')
  }
)

export default stringify
