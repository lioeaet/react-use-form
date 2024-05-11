import { VALIDATOR_OBJ } from './validate'

export function iterateDeep(value, cb, path = []) {
  cb(path, value)

  if (Array.isArray(value))
    value.forEach((item, i) => {
      iterateDeep(value[i], cb, [...path, i])
    })
  else if (isPlainObj(value)) {
    for (let key in value) iterateDeep(value[key], cb, [...path, key])
    Object.getOwnPropertySymbols(value).forEach((sym) => {
      iterateDeep(value[sym], cb, [...path, sym])
    })
  }
}

export function isPlainObj(x) {
  return x?.__proto__ === {}.__proto__
}

export function clone(x) {
  if (isPlainObj(x)) {
    const newInst = {}
    for (let key in x) newInst[key] = x[key]
    return newInst
  } else if (Array.isArray(x)) return x.map(clone)
  else return x
}

export function getFieldFromInst(name, inst) {
  return name
    .split('.')
    .reduce((current, pathName) => current?.[pathName], inst)
}

export function getFieldFromValidatorsMap(name, validatorsMap) {
  return name.split('.').reduce((current, pathName) => {
    if (current?.[VALIDATOR_OBJ]) {
      current = current?.[VALIDATOR_OBJ]
    }
    return current?.[pathName]
  }, validatorsMap)
}

export function setFieldToInst(name, value, inst) {
  const path = name.split('.')
  let current = inst
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i + 1 === path.length) current[key] = value
    else current = current[key]
  }
  return inst
}

export function splitFieldOfArrayName(arrayFieldName, fieldName) {
  const keyAfterArray = fieldName.slice(arrayFieldName.length + 1)
  return {
    num: Number(keyAfterArray.slice(0, keyAfterArray.indexOf('.'))),
    fieldEndPart: keyAfterArray.slice(keyAfterArray.indexOf('.') + 1),
  }
}

export function getLastArrayOfFieldName(name, arrayFields) {
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

export function getFieldNameWithoutI(name, lastArrayOfFieldName) {
  const path = name.split('.')
  const arrayFieldPath = lastArrayOfFieldName.split('.')

  const pathWithoutI = []
  for (let i = 0; i < path.length; i++) {
    if (arrayFieldPath[i] === 'i' || i === arrayFieldPath.length) continue
    else pathWithoutI.push(path[i])
  }
  return pathWithoutI.join('.')
}
