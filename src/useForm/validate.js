import { getFieldFromInst } from './util'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
const ARRAY_FIELD = Symbol('array field')

export function getFieldsValidateOnChange(
  name,
  validatorsMap,
  childFields,
  stateRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  if (validationEnabled[name]) {
    const validators = getFieldValidatorsDefault(name, validatorsMap)
    if (validators) fieldsValidate[name] = validators
  }

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        const validators = getFieldValidatorsDefault(fieldName, validatorsMap)
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
  stateRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  fieldsValidate[name] = getValidateFieldAdvanced(name, validatorsMap, 'BLUR')

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        fieldsValidate[fieldName] = getValidateFieldAdvanced(
          fieldName,
          validatorsMap,
          'BLUR'
        )
      }
    }
  }

  return fieldsValidate
}

function getFieldValidatorsDefault(name, validatorsMap) {
  const validator = getFieldFromInst(name, validatorsMap)

  if (validator?.[ADVANCED_VALIDATOR]) {
    if (typeof validator.CHANGE === 'function')
      return {
        validators: [validator.CHANGE],
        argsFields: [name, ...validator.PARENTS],
      }
    return {
      validators: validator.CHANGE,
      argsFields: [name, ...validator.PARENTS],
    }
  } else if (Array.isArray(validator)) {
    return { validators: validator, argsFields: [name] }
  } else if (typeof validator === 'function')
    return { validator: [validator.CHANGE], argsFields: [name] }
}

function getValidateFieldAdvanced(name, validatorsMap, type) {
  const validator = getFieldFromInst(name, validatorsMap)
  if (validator?.[ADVANCED_VALIDATOR])
    return {
      validators:
        typeof validator[type] === 'function'
          ? [validator[type]]
          : Array.isArray(validator[type])
          ? validator[type]
          : [],
      argsFields: [name, ...validator.PARENTS],
    }

  return { validators: [], argsFields: [name] }
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
