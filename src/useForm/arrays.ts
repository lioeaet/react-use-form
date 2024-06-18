export function getLastArrayOfFieldName(name: string, arrayFields: string[]) {
  const path = name.split('.')
  const targetArrayFields = arrayFields.filter((arrayField) => {
    const arrayFieldPath = arrayField.split('.')
    for (let i = 0; i < arrayFieldPath.length; i++) {
      if (arrayFieldPath[i] !== path[i]) {
        if (arrayFieldPath[i] === 'i' && typeof Number(path[i]) === 'number')
          continue
        else return false
      }
    }
    return true
  })
  return targetArrayFields[targetArrayFields.length - 1]
}

// array.0.name.one.0.oki => array.i.name.one.i.oki, [0, 0], ['array', 'name.one', 'oki']
export function splitOnPathWithIndexes(name: string, arrayFields: string[]) {
  const fieldPath = name.split('.')
  const lastArrayOfFieldName = getLastArrayOfFieldName(name, arrayFields)
  if (!lastArrayOfFieldName) return { path: [name], indexes: [] }

  const arrayPath = lastArrayOfFieldName.split('.')

  const indexes = []
  const path = []

  let currentPathName = ''
  for (let i = 0; i < fieldPath.length; i++) {
    if (arrayPath[i] === 'i' || i === arrayPath.length) {
      path.push(currentPathName)
      indexes.push(+fieldPath[i])
      currentPathName = ''
    } else {
      if (currentPathName) currentPathName += `.${fieldPath[i]}`
      else currentPathName = fieldPath[i]
    }
  }
  path.push(currentPathName)
  return { indexes, path }
}

export function replaceIOnNum(name: string, indexes: number[]) {
  let pathWithIndexes = []
  let currentIndex = 0
  const path = name.split('.')
  for (let i = 0; i < path.length; i++) {
    if (path[i] === 'i') {
      pathWithIndexes.push(indexes[currentIndex])
      currentIndex++
    } else {
      pathWithIndexes.push(path[i])
    }
  }
  return pathWithIndexes.join('.')
}

// функция для вложенных форм
// для трансформации 'array.i.oki.doki.i.poki' в argsFields['array.0.oki.doki.1.poki']
export function replaceIOnNumIfInArray(
  arrayFields: string[],
  name: string,
  fieldWithNumInArray: string
) {
  const { indexes } = splitOnPathWithIndexes(fieldWithNumInArray, arrayFields)
  if (!indexes.length) return name
  return replaceIOnNum(name, indexes)
}

export function getFieldNameWithoutI(
  name: string,
  lastArrayOfFieldName: string
) {
  const path = name.split('.')
  const arrayFieldPath = lastArrayOfFieldName.split('.')

  const pathWithoutI = []
  for (let i = 0; i < path.length; i++) {
    if (arrayFieldPath[i] === 'i' || i === arrayFieldPath.length) continue
    else pathWithoutI.push(path[i])
  }
  return pathWithoutI.join('.')
}

export function splitFieldOfArrayName(arrayFieldName: string, name: string) {
  const keyAfterArray = name.slice(arrayFieldName.length + 1)
  return {
    num: Number(keyAfterArray.slice(0, keyAfterArray.indexOf('.'))),
    fieldEndPart: keyAfterArray.slice(keyAfterArray.indexOf('.') + 1),
  }
}
