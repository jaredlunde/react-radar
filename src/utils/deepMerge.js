import isMergeableObject from 'is-mergeable-object'
import {isStoreRecord} from '../Store'


export const mergeIfMergeable = (value, optionsArgument) => {
  return isMergeableObject(value)
    ? deepMerge(Array.isArray(value) ? [] : {}, value, optionsArgument)
    : value
}

export const arrayMergeOverwrite = (target, source, optionsArgument) => {
  if (target === source) {
    return target
  }

  const output = [...target]

  for (let x = 0; x < source.length; x++) {
    output[x] = mergeIfMergeable(source[x], optionsArgument)
  }

  return output
}

export const arrayMergeConcat = (target, source, optionsArgument) => {
  if (target === source) {
    return target
  }

  const output = [...target]

  for (let x = 0; x < source.length; x++) {
    output.push(mergeIfMergeable(source[x], optionsArgument))
  }

  return output
}

export const arrayMergeReplace = (target, source, optionsArgument) => {
  if (target === source) {
    return target
  }

  const output = []

  for (let x = 0; x < source.length; x++) {
    output.push(mergeIfMergeable(source[x], optionsArgument))
  }

  return output
}

const mergeObject = (target, source, optionsArgument) => {
  if (target === source) {
    return target
  }

  if (isStoreRecord(target) || isStoreRecord(source)) {
    return source
  }

	const destination = {...target}
  /**
	if (isMergeableObject(target)) {
    const targetKeys = Object.keys(target)

    for (let x = 0; x < targetKeys.length; x++) {
      const key = targetKeys[x]
      destination[key] = mergeIfMergeable(target[key], optionsArgument)
    }
	}
  */
  const sourceKeys = Object.keys(source)

  for (let x = 0; x < sourceKeys.length; x++) {
    const key = sourceKeys[x]

    if (!isMergeableObject(source[key]) || target[key] === void 0) {
			destination[key] = mergeIfMergeable(source[key], optionsArgument)
		} else {
			destination[key] = deepMerge(target[key], source[key], optionsArgument)
		}
  }

	return destination
}

const deepMerge = (target, source, optionsArgument) => {
	const sourceIsArray = Array.isArray(source),
        targetIsArray = Array.isArray(target),
        options = optionsArgument || { arrayMerge: arrayMergeOverwrite },
        sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

	if (!sourceAndTargetTypesMatch) {
		return mergeIfMergeable(source, optionsArgument)
	} else if (sourceIsArray) {
		return (options.arrayMerge || arrayMergeOverwrite)(target, source, optionsArgument)
	} else {
		return mergeObject(target, source, optionsArgument)
	}
}

export default deepMerge
