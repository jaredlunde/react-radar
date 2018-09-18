export default function isStoreRecord (obj) {
  return obj && obj.key !== void 0 && obj.state !== void 0
}
