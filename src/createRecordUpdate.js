import createQuery, {noop} from './createQuery'


export default function createRecordUpdate (opt) {
  opt = Object.assign({}, opt)
  opt.reducer = noop

  const query = createQuery(opt)
  query.isRecordUpdate = true
  
  return query
}
