import { getFieldFromInst, getFieldFromValidatorsMap, isPlainObj } from './util'
import {
  splitOnPathWithIndexes,
  replaceIOnNum,
  replaceIOnNumIfInArray,
  getLastArrayOfFieldName,
  getFieldNameWithoutI,
} from './arrays'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
export const ARRAY_FIELD = Symbol('array field')
export const VALIDATOR_OBJ = Symbol('validator obj')

export function getFieldsValidateOnChange(
  name,
  validatorsMap,
  childFields,
  stateRef,
  arrayFields
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  if (validationEnabled[name]) {
    const validators = getFieldValidatorsOnChange(
      name,
      validatorsMap,
      arrayFields
    )
    if (validators) fieldsValidate[name] = validators
  }

  // array.0.name.oki.0.doki -> ['array', 'name.oki', 'doki'], [0, 0]
  const { indexes, path } = splitOnPathWithIndexes(name, arrayFields)
  const abstractFieldName = path.join('.i.').replaceAll('..', '.')

  if (childFields[abstractFieldName]) {
    for (let fieldName of childFields[abstractFieldName]) {
      // ?TODO: array.1.i.name
      // parent для всех возможных i (array.1.0.name, array.1.1.name...)
      if (indexes.length) {
        // array.i.name -> array.1.name
        fieldName = replaceIOnNum(fieldName, indexes)
      }
      if (validationEnabled[fieldName]) {
        const validators = getFieldValidatorsOnChange(
          fieldName,
          validatorsMap,
          arrayFields
        )
        if (validators) fieldsValidate[fieldName] = validators
      }
    }
  }

  return fieldsValidate
}

export function getFieldsValidateOnBlur(
  name,
  validatorsMap,
  childFields,
  arrayFields,
  stateRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  fieldsValidate[name] = getValidateFieldOnBlur(
    name,
    validatorsMap,
    arrayFields
  )

  // array.0.name.oki.0.doki -> ['array', 'name.oki', 'doki'], [0, 0]
  const { indexes, path } = splitOnPathWithIndexes(name, arrayFields)
  const abstractFieldName = path.join('.i.').replaceAll('..', '.')

  if (childFields[abstractFieldName]) {
    for (let fieldName of childFields[abstractFieldName]) {
      if (indexes.length) {
        // array.i.name -> array.1.name
        fieldName = replaceIOnNum(fieldName, indexes)
      }
      if (validationEnabled[fieldName]) {
        fieldsValidate[fieldName] = getValidateFieldOnBlur(
          fieldName,
          validatorsMap,
          arrayFields
        )
      }
    }
  }

  return fieldsValidate
}

// submit
// пройтись по всем полям, добавляя валидаторы, если есть
// пройтись по всем валидаторам и добавить их для полей, которых нет в values
export function getFieldsValidateOnSubmit(
  validatorsMap,
  arrayFields,
  stateRef
) {
  const fieldsValidate = {}
  const arraySubformsValidate = {}

  iterateValidationMap(validatorsMap, (path, val) => {
    const name = path.join('.')
    const parentArrayName = arrayFields.find(
      (arrayFieldName) => path.join('.') === arrayFieldName
    )
    if (!parentArrayName) {
      fieldsValidate[name] = getFieldValidateOnSubmit(name, val, arrayFields)
    } else {
      arraySubformsValidate[name] = val
    }
  })

  for (const arrayName in arraySubformsValidate) {
    const value = getFieldFromInst(arrayName, stateRef.current.values)
    for (let i = 0; i < value.length; i++) {
      const subformValidationMap = arraySubformsValidate[arrayName]
      // удаляем этот флаг для итераций через iterateValidationMap
      // после выполнения функции возвращаем
      delete subformValidationMap[ARRAY_FIELD]

      iterateValidationMap(subformValidationMap, (path, val) => {
        const fullName = `${arrayName}.${i}.${path.join('.')}`
        fieldsValidate[fullName] = getFieldValidateOnSubmit(
          fullName,
          val,
          arrayFields
        )
      })
      subformValidationMap[ARRAY_FIELD] = true
    }
  }

  return fieldsValidate
}

function getFieldValidateOnSubmit(name, val, arrayFields) {
  if (Array.isArray(val)) {
    return {
      validators: val,
      argsFields: [name],
    }
  } else if (typeof val === 'function') {
    return {
      validators: [val],
      argsFields: [name],
    }
  } else {
    const validators = []
    if (Array.isArray(val.CHANGE)) {
      validators.push(...val.CHANGE)
    } else if (typeof val.CHANGE === 'function') {
      validators.push(val.CHANGE)
    }
    if (Array.isArray(val.BLUR)) {
      validators.push(...val.BLUR)
    } else if (typeof val.BLUR === 'function') {
      validators.push(val.BLUR)
    }
    if (Array.isArray(val.SUBMIT)) {
      validators.push(...val.SUBMIT)
    } else if (typeof val.SUBMIT === 'function') {
      validators.push(val.SUBMIT)
    }

    return {
      validators,
      argsFields: [
        name,
        ...val.PARENTS?.map((parentName) => {
          return replaceIOnNumIfInArray(arrayFields, parentName, name)
        }),
      ],
    }
  }
}

function getFieldValidatorsOnChange(name, validatorsMap, arrayFields) {
  // array.1.name.1.oki -> array.name.oki
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromValidatorsMap(validatorName, validatorsMap)

  if (validator?.[ADVANCED_VALIDATOR]) {
    const validatorObj = validator[VALIDATOR_OBJ]
    // array.i.name -> array.1.name
    const parentsWithNumInArrays =
      validatorObj.PARENTS?.map((parentName) => {
        return replaceIOnNumIfInArray(arrayFields, parentName, name)
      }) || []

    if (typeof validatorObj.CHANGE === 'function')
      return {
        validators: [validatorObj.CHANGE],
        argsFields: [name, ...parentsWithNumInArrays],
      }
    return {
      validators: validatorObj.CHANGE,
      argsFields: [name, ...parentsWithNumInArrays],
    }
  } else if (Array.isArray(validator)) {
    return {
      validators: validator,
      argsFields: [name],
    }
  } else if (typeof validator === 'function')
    return {
      validators: [validator],
      argsFields: [name],
    }
}

function getValidateFieldOnBlur(name, validatorsMap, arrayFields) {
  // array.1.name.1.oki -> array.name.oki
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromValidatorsMap(validatorName, validatorsMap)
  if (validator?.[ADVANCED_VALIDATOR]) {
    const validatorObj = validator[VALIDATOR_OBJ]

    return {
      validators:
        typeof validatorObj.BLUR === 'function'
          ? [validatorObj.BLUR]
          : Array.isArray(validatorObj.BLUR)
          ? validatorObj.BLUR
          : [],
      argsFields: [
        name,
        ...validatorObj.PARENTS?.map((parentName) => {
          return replaceIOnNumIfInArray(arrayFields, parentName, name)
        }),
      ],
    }
  }

  return { validators: [], argsFields: [name] }
}

function iterateValidationMap(value, cb, path = []) {
  if (isPlainObj(value)) {
    if (value[ADVANCED_VALIDATOR]) {
      cb(path, value[VALIDATOR_OBJ])
    } else {
      for (let key in value) {
        if (value[ARRAY_FIELD]) {
          cb(path, value[VALIDATOR_OBJ])
        } else {
          iterateValidationMap(value[key], cb, [...path, key])
        }
      }
    }
  } else {
    cb(path, value)
  }
}

function getValidatorName(fieldName, arrayFields) {
  // array.1.name.1.oki -> array.i.name
  const lastArrayOfFieldName = getLastArrayOfFieldName(fieldName, arrayFields)
  if (lastArrayOfFieldName) {
    // array.1.name.1.oki -> array.name.oki
    return getFieldNameWithoutI(fieldName, lastArrayOfFieldName)
  } else return fieldName
}

export function joinValidators(...validators) {
  const result = {}
  for (let validator of validators) {
    for (let fieldName in validator) {
      if (!result[fieldName]) result[fieldName] = validator[fieldName]
      else
        result[fieldName].validators = [
          ...result[fieldName].validators,
          ...validator[fieldName].validators,
        ]
    }
  }
  return result
}

export const advanced = (validatorObj) => ({
  [VALIDATOR_OBJ]: validatorObj,
  [ADVANCED_VALIDATOR]: true,
})

export const array = (validatorObj) => ({
  [VALIDATOR_OBJ]: validatorObj,
  [ARRAY_FIELD]: true,
})
