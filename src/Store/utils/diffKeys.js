export default (prevArr, nextArr) => {
  if (prevArr.length === 0 || nextArr.length === 0) {
    return prevArr
  }

  const diff = []

  for (let x = 0; x < prevArr.length; x++) {
    const arrVal = prevArr[x]

    if (nextArr.indexOf(arrVal) === -1) {
      diff.push(arrVal)
    }
  }

  return diff
}
