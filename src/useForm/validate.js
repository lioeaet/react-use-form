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
    for (let name of childFields[abstractFieldName]) {
      // ?TODO: array.1.i.name
      // parent для всех возможных i (array.1.0.name, array.1.1.name...)
      if (indexes.length) {
        // array.i.name -> array.1.name
        name = replaceIOnNum(name, indexes)
      }
      if (validationEnabled[name]) {
        const validators = getFieldValidatorsOnChange(
          name,
          validatorsMap,
          arrayFields
        )
        if (validators) fieldsValidate[name] = validators
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
    for (let name of childFields[abstractFieldName]) {
      if (indexes.length) {
        // array.i.name -> array.1.name
        name = replaceIOnNum(name, indexes)
      }
      if (validationEnabled[name]) {
        fieldsValidate[name] = getValidateFieldOnBlur(
          name,
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
  const arrayFieldsValidators = {}

  iterateValidationMap(validatorsMap, (path, val) => {
    const name = path.join('.')
    const parentArrayName = getLastArrayOfFieldName(name, arrayFields)
    if (!parentArrayName) {
      fieldsValidate[name] = getFieldValidateOnSubmit(name, val, arrayFields)
    } else {
      arrayFieldsValidators[name] = val
    }
  })

  for (const abstractFieldName in arrayFieldsValidators) {
    const path = abstractFieldName.replaceAll('.i.i.', '.i..i.').split('.i.')

    const arrayFieldsValues = getConcreteArrayFieldsValidators(
      path,
      stateRef,
      arrayFieldsValidators[abstractFieldName]
    )
    for (const arrayFieldName in arrayFieldsValues) {
      fieldsValidate[arrayFieldName] = getFieldValidateOnSubmit(
        arrayFieldName,
        arrayFieldsValues[arrayFieldName],
        arrayFields
      )
    }
  }

  return fieldsValidate
}

function getConcreteArrayFieldsValidators(
  path,
  stateRef,
  validator,
  currentPath = '',
  result = {}
) {
  if (path.length === 1) {
    currentPath += `.${path[0]}`
    result[currentPath] = validator
    return result
  }

  const [current, ...remainingPath] = path

  const fields = getFieldFromInst(
    currentPath && current
      ? `${currentPath}.${current}`
      : current
      ? current
      : currentPath,
    stateRef.current.values
  )

  fields.forEach((_, index) => {
    let newPath
    if (currentPath && current) {
      newPath = `${currentPath}.${current}.${index}`
    } else if (current) {
      newPath = `${current}.${index}`
    } else {
      newPath = `${currentPath}.${index}`
    }

    getConcreteArrayFieldsValidators(
      remainingPath,
      stateRef,
      validator,
      newPath,
      result
    )
  })

  return result
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
      if (value[ARRAY_FIELD]) {
        iterateValidationMap(value[VALIDATOR_OBJ], cb, [...path, 'i'])
      } else {
        for (let key in value) {
          iterateValidationMap(value[key], cb, [...path, key])
        }
      }
    }
  } else {
    cb(path, value)
  }
}

function getValidatorName(name, arrayFields) {
  // array.1.name.1.oki -> array.i.name
  const lastArrayOfFieldName = getLastArrayOfFieldName(name, arrayFields)
  if (lastArrayOfFieldName) {
    // array.1.name.1.oki -> array.name.oki
    return getFieldNameWithoutI(name, lastArrayOfFieldName)
  } else return name
}

export function joinFieldsValidate(...validators) {
  const result = {}
  for (let validator of validators) {
    for (let name in validator) {
      if (!result[name]) result[name] = validator[name]
      else
        result[name].validators = [
          ...result[name].validators,
          ...validator[name].validators,
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
