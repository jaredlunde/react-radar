import emptyObj from 'empty/object'
import emptyArr from 'empty/array'
import createQueryResolver from './createQueryResolver'


function errorToJSON (error) {
  return (
    error.toJSON !== void 0
      ? error.toJSON()
      : error instanceof Error
        ? {message: String(error)}
        : error
  )
}

function createErrorResponse (error) {
  return {
    isRadarError: true,
    error: Array.isArray(error) ? error.map(errorToJSON) : errorToJSON(error)
  }
}

export default function createResolver (initialQueries = emptyArr) {
  const queries = {}

  function addQueries (qs) {
    for (let q of qs) {
      queries[q.id] = q
    }
  }

  addQueries(initialQueries)

  const resolver = {
    resolve: (...qs) => {
      const queries = qs.map(q => createQueryResolver(q))
      addQueries(queries)
      return queries.length === 1 ? queries[0] : queries
    },
    // resolves the queries in a given JSON object
    async map (reqQueries, context) {
      reqQueries = typeof reqQueries === 'string' ? JSON.parse(reqQueries) : reqQueries
      const result = []

      for (let query of reqQueries) {
        if (query === null) {
          // null queries just return null responses
          return null
        }
        else if (queries[query.name] !== void 0) {
          // found a query that matches the name so we will add its result
          // to the list, catching any errors
          try {
            const queryResolver = queries[query.name]
            const acc = queryResolver(
              query.props || emptyObj,
              {
                ...context,
                requires: query.requires || emptyObj
              }
            )

            if (queryResolver.sync === true) {
              result.push(await acc)
            }
            else {
              result.push(acc.then(r => r).catch(createErrorResponse))
            }
          }
          catch (error) {
            result.push(createErrorResponse(error))
          }
        }
        else {
          // a query with this name was not found so we throw an error to
          // completely bail out
          result.push(createErrorResponse(`Query not found: '${query.name}'`))
        }
      }

      return Promise.all(result)
    },
    // handles express requests
    async handler (req, res) {
      try {
        res.status(200).json(await resolver.map(req.body, {req, res}))
      }
      catch (error) {
        // handles any errors encountered in the resolving process
        if (__DEV__) {
          console.log('[Radar Error]', error)
        }
        // only sets a status code for non-200 requests, otherwise
        // it assumes you set your own status code
        if (res.statusCode === 200 || res.statusCode === void 0) {
          res.status(500)
        }
        // returns a custom error page if there is one, otherwise just the
        // error message
        res.json(createErrorResponse(error))
      }
    }
  }

  return resolver
}
