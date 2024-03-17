import { getFieldFromInst } from './util'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
const ARRAY_FIELD = Symbol('array field')

export function execValidate(name, validator, values) {
  if (validator?.[ADVANCED_VALIDATOR]) {
    const parentsValues = (validator.PARENTS || []).map((parentName) =>
      getFieldFromInst(parentName, values)
    )
    return validator(getFieldFromInst(name, values), ...parentsValues)
  } else return validator(getFieldFromInst(name, values))
}

// getValidateField

export function getFieldsValidateOnChange(
  name,
  validators,
  childFields,
  stateRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  if (validationEnabled[name]) {
    const validate = getValidateFieldDefault(name, validators)
    if (validate) fieldsValidate[name] = validate
  }

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        const validate = getValidateFieldDefault(fieldName, validators)
        if (validate) fieldsValidate[fieldName] = validate
      }
    }
  }

  return fieldsValidate
}

export function getFieldsValidateOnValidate(
  name,
  validators,
  childFields,
  stateRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  fieldsValidate[name] = getValidateFieldAdvanced(name, validators, 'VALIDATE')

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        fieldsValidate[fieldName] = getValidateFieldAdvanced(
          fieldName,
          validators,
          'VALIDATE'
        )
      }
    }
  }

  return fieldsValidate
}

export function getFieldsValidateOnSubmit(name, validators, childFields) {
  const fieldsValidate = {}

  fieldsValidate[name] = getValidateFieldAdvanced(name, validators, 'SUBMIT')

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      fieldsValidate[fieldName] = getValidateFieldAdvanced(
        fieldName,
        validators,
        'SUBMIT'
      )
    }
  }

  return fieldsValidate
}

function getValidateFieldDefault(name, validators) {
  const validator = getFieldFromInst(name, validators)

  if (validator?.DEFAULT) {
    if (typeof validator.DEFAULT === 'function') return validator.DEFAULT
    return getPipedValidators(validator.DEFAULT, validator.PARENTS)
  } else if (typeof validator === 'function') return validator
}

function getValidateFieldAdvanced(name, validators, type) {
  const validator = getFieldFromInst(name, validators)
  if (!validator?.[type]) return () => {}

  return getPipedValidators(validator.VALIDATE, validator.PARENTS)
}

function getPipedValidators(validators, parents) {
  function pipedValidators(...args) {
    for (const func of validators) {
      const result = func(...args)
      if (result) return result
    }
  }
  pipedValidators[ADVANCED_VALIDATOR] = true
  pipedValidators.PARENTS = parents
  return pipedValidators
}

export function advanced(validator) {
  validator = { ...validator }
  validator.type = ADVANCED_VALIDATOR
  return validator
}

export function array(field) {
  return {
    type: ARRAY_FIELD,
    field: field,
  }
}
