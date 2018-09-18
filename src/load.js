import reactTreeWalker from 'react-tree-walker'
import emptyObj from 'empty/object'



// preloads all of the async components used in the current react tree
export default function load (app, visitor, context = emptyObj) {
  let stop = false

  function loadVisitor (element, instance) {
    if (stop === true) {
      return false
    }

    if (instance && instance.isRadarQuery === true) {
      if (instance.props.stopIteration === true) {
        stop = true
      }

      return instance.load()
    }
  }

  if (visitor) {
    visitor = function composedVisitor (element, instance) {
      const promise = loadVisitor(element, instance)

      if (promise !== void 0) {
        return promise
      }

      return visitor(element, instance)
    }
  }
  else {
    visitor = loadVisitor
  }

  return reactTreeWalker(app, visitor, context)
}
