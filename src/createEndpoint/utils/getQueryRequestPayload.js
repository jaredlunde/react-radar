export default function (queries, queryProps = {}) {
  // bails out if there were no queries
  return queries === null ? null : queries.map(
    query => {
      query = query(queryProps)

      // bails out of this query if it was empty
      if (query === void 0 || query === null) {
        return null
      }

      for (let key in query.contains) {
        query.contains[key] = query.contains[key].containsFields
      }

      return query
    }
  )
}
