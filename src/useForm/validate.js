import { getFieldFromInst } from './util'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
const ARRAY_FIELD = Symbol('array field')

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

export function execValidate(name, validator, values) {
  if (validator?.[ADVANCED_VALIDATOR]) {
    console.log(validator, values)
    const parentsValues = (validator.PARENTS || []).map((parentName) =>
      getFieldFromInst(parentName, values)
    )
    return validator(getFieldFromInst(name, values), ...parentsValues)
  } else return validator(getFieldFromInst(name, values))
}

// getValidateField

export function getFieldsValidateOnChange(name, validators, childFields) {
  const fieldsValidateOnChange = {}
  const validator = getValidateFieldDefault(name, validators)
  fieldsValidateOnChange[name] = validator

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      fieldsValidateOnChange[fieldName] = getValidateFieldDefault(
        fieldName,
        validators
      )
    }
  }

  return fieldsValidateOnChange
}

function getValidateFieldDefault(name, validators) {
  const validator = getFieldFromInst(name, validators)

  if (typeof validator === 'function') return validator
  if (validator?.DEFAULT) {
    if (typeof validator.DEFAULT === 'function') return validator.DEFAULT
    return getPipedValidators(validator.DEFAULT, validator.PARENTS)
  }
}

// password, password.repeat, passwords[12].repeat
// export function getValidateDefault(name, validators, state) {
//   const validator = name
//     .split('.')
//     .reduce(
//       (current, name) =>
//         typeof current === 'function' || current?.type === ADVANCED_VALIDATOR
//           ? current
//           : current?.[name],
//       validators
//     )
// }

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

// export function defaultValidateField(name, validate, values) {
//   if ()
// }
