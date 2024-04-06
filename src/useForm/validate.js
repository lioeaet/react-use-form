import { getFieldFromInst, splitFieldOfArrayName, isPlainObj } from './util'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
export const ARRAY_FIELD = Symbol('array field')

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

  // array.0.name -> array.i.name, 0, array
  const { abstractFieldName, idxInArray, arrayFieldName } =
    getAbstractNameWithArrayVars(name, arrayFields)

  if (childFields[abstractFieldName]) {
    for (let fieldName of childFields[abstractFieldName]) {
      if (arrayFieldName) {
        // array.name -> array.i.name
        fieldName = `${arrayFieldName}.${idxInArray}.${fieldName.slice(
          arrayFieldName.length + 1
        )}`
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

  fieldsValidate[name] = getValidateFieldAdvanced(
    name,
    validatorsMap,
    arrayFields,
    'BLUR'
  )

  // array.0.name -> array.i.name, 0, array
  const { abstractFieldName, idxInArray, arrayFieldName } =
    getAbstractNameWithArrayVars(name, arrayFields)

  if (childFields[abstractFieldName]) {
    for (let fieldName of childFields[abstractFieldName]) {
      if (arrayFieldName) {
        // array.name -> array.i.name
        fieldName = `${arrayFieldName}.${idxInArray}.${fieldName.slice(
          arrayFieldName.length + 1
        )}`
      }
      if (validationEnabled[fieldName]) {
        fieldsValidate[fieldName] = getValidateFieldAdvanced(
          fieldName,
          validatorsMap,
          arrayFields,
          'BLUR'
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

function iterateValidationMap(value, cb, path = []) {
  if (isPlainObj(value)) {
    if (value[ADVANCED_VALIDATOR]) {
      cb(path, value)
    } else {
      for (let key in value) {
        if (value[ARRAY_FIELD]) {
          cb([...path], value)
        } else {
          iterateValidationMap(value[key], cb, [...path, key])
        }
      }
    }
  } else {
    cb(path, value)
  }
}

// array.0.name -> array.i.name, 0, array
function getAbstractNameWithArrayVars(name, arrayFields) {
  let abstractFieldName = name
  let idxInArray
  const arrayFieldName = arrayFields.find((arrayFieldName) =>
    name.startsWith(arrayFieldName)
  )
  if (arrayFieldName) {
    const { num, fieldEndPart } = splitFieldOfArrayName(arrayFieldName, name)
    abstractFieldName = `${arrayFieldName}.i.${fieldEndPart}`
    idxInArray = num
  }
  return { abstractFieldName, idxInArray, arrayFieldName }
}

function getFieldValidatorsOnChange(name, validatorsMap, arrayFields) {
  // array.1.name -> array.name
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromInst(validatorName, validatorsMap)

  // array.i.name -> array.1.name
  const parentsWithNumInArrays =
    validator.PARENTS?.map((parentName) => {
      return replaceIOnNumIfInArray(arrayFields, parentName, name)
    }) || []

  if (validator?.[ADVANCED_VALIDATOR]) {
    if (typeof validator.CHANGE === 'function')
      return {
        validators: [validator.CHANGE],
        argsFields: [name, ...parentsWithNumInArrays],
      }
    return {
      validators: validator.CHANGE,
      argsFields: [name, ...parentsWithNumInArrays],
    }
  } else if (Array.isArray(validator)) {
    return {
      validators: validator,
      argsFields: [name, ...parentsWithNumInArrays],
    }
  } else if (typeof validator === 'function')
    return {
      validators: [validator],
      argsFields: [name, ...parentsWithNumInArrays],
    }
}

function getValidateFieldAdvanced(name, validatorsMap, arrayFields, type) {
  // array.1.name -> array.name
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromInst(validatorName, validatorsMap)
  if (validator?.[ADVANCED_VALIDATOR])
    return {
      validators:
        typeof validator[type] === 'function'
          ? [validator[type]]
          : Array.isArray(validator[type])
          ? validator[type]
          : [],
      argsFields: [
        name,
        ...validator.PARENTS?.map((parentName) => {
          return replaceIOnNumIfInArray(arrayFields, parentName, name)
        }),
      ],
    }

  return { validators: [], argsFields: [name] }
}

function getValidatorName(fieldName, arrayFields) {
  // array.1.name -> array
  const arrayFieldName = arrayFields.find((arrayFieldName) =>
    fieldName.startsWith(arrayFieldName)
  )
  if (arrayFieldName) {
    const { fieldEndPart } = splitFieldOfArrayName(arrayFieldName, fieldName)
    // array.name
    return `${arrayFieldName}.${fieldEndPart}`
  } else return fieldName
}

// функция для вложенных форм
// для трансформации PARENTS: ['array.i.oki'] в argsFields['array.0.oki']
function replaceIOnNumIfInArray(arrayFields, name, fieldWithNumInArray) {
  // ['array'].find('array.i.name'.startsWith('array'))
  const arrayFieldName = arrayFields.find((arrayFieldName) =>
    name.startsWith(arrayFieldName)
  )
  if (!arrayFieldName) return name

  const { num } = splitFieldOfArrayName(arrayFieldName, fieldWithNumInArray)
  const { fieldEndPart } = splitFieldOfArrayName(arrayFieldName, name)
  // array.1.name
  return `${arrayFieldName}.${num}.${fieldEndPart}`
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
  ...validatorObj,
  [ADVANCED_VALIDATOR]: true,
})

export const array = (validatorObj) => ({
  ...validatorObj,
  [ARRAY_FIELD]: true,
})
