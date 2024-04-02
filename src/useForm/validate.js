import { getFieldFromInst, splitFieldOfArrayName } from './util'

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

  // махинации с именем внутри массивов с учетом i
  let nameInChildFields = name
  let idxInArray
  // arrayFields.find('array.0.name') -> 'array'
  const arrayFieldName = arrayFields.find((arrayFieldName) => {
    return name.startsWith(arrayFieldName)
  })
  if (arrayFieldName) {
    const { num, fieldEndPart } = splitFieldOfArrayName(arrayFieldName, name)
    nameInChildFields = `${arrayFieldName}.i.${fieldEndPart}`
    idxInArray = num
  }

  if (childFields[nameInChildFields]) {
    for (let fieldName of childFields[nameInChildFields]) {
      if (arrayFieldName) {
        // добавляем индекс родителя из массивов
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

export function getFieldsValidateOnValidate(
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

  // здесь в childFields array.i.name
  // но name = array.0.name
  // для массивов нужно заменить array.0.name->array.i.name
  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
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
  // [...arrayFields].find('array.i.name')
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

export function advanced(validator) {
  validator = { ...validator }
  validator[ADVANCED_VALIDATOR] = true
  return validator
}

export function array(field) {
  return {
    type: ARRAY_FIELD,
    field: field,
  }
}
