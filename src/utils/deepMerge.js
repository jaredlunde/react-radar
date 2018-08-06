import isMergeableObject from 'is-mergeable-object'
import {isStoreRecord} from '../Store'


export function mergeIfMergeable (value, optionsArgument) {
	return isMergeableObject(value)
		? deepMerge(Array.isArray(value) ? [] : {}, value, optionsArgument)
		: value
}


export function arrayMergeOverwrite (target, source, optionsArgument) {
  if (target === source) {
    return target
  }

  const output = [...target]

  for (let x = 0; x < source.length; x++) {
    output[x] = mergeIfMergeable(source[x], optionsArgument)
  }

  return output
}


export function arrayMergeConcat (target, source, optionsArgument) {
  if (target === source) {
    return target
  }

  const output = [...target]

  for (let x = 0; x < source.length; x++) {
    output.push(mergeIfMergeable(source[x], optionsArgument))
  }

  return output
}


export function arrayMergeReplace (target, source, optionsArgument) {
  if (target === source) {
    return target
  }

  const output = []

  for (let x = 0; x < source.length; x++) {
    output.push(mergeIfMergeable(source[x], optionsArgument))
  }

  return output
}


function mergeObject (target, source, optionsArgument) {
  if (target === source) {
    return target
  }

  if (isStoreRecord(target) || isStoreRecord(source)) {
    return source
  }

	var destination = {...target}
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


function deepMerge (target, source, optionsArgument) {
	var sourceIsArray = Array.isArray(source)
	var targetIsArray = Array.isArray(target)
	var options = optionsArgument || { arrayMerge: arrayMergeOverwrite }
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

	if (!sourceAndTargetTypesMatch) {
		return mergeIfMergeable(source, optionsArgument)
	} else if (sourceIsArray) {
		var arrayMerge = options.arrayMerge || arrayMergeOverwrite
		return arrayMerge(target, source, optionsArgument)
	} else {
		return mergeObject(target, source, optionsArgument)
	}
}


export default deepMerge
