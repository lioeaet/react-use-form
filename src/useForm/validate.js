const ADVANCED_VALIDATOR = Symbol('advanced validator')
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

// getValidateFieldWithValues

export function getFieldsValidateOnChange(name, validators, state) {
  const fieldsValidateOnChange = {}
  const validator = getValidateFieldDefault(getFieldFromInst(name, validators))

  if (validator?.type === ADVANCED_VALIDATOR && validator?.dependantFields) {
    for (const fieldName of validator.dependantFields) {
      fieldsValidateOnChange[fieldName] = getValidateFieldDefault(
        getFieldFromInst(fieldName, validators)
      )
    }
  }

  return fieldsValidateOnChange
}

function getValidateFieldDefault(validator) {
  if (typeof validator === 'function') return validator
  if (validator?.DEFAULT) {
    if (typeof validator?.DEFAULT === 'function') return validator?.DEFAULT
    return pipeValidators(validator?.DEFAULT)
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

// name.split не так проста из-за i в массивах
export function getFieldFromInst(name, inst) {
  return name.split('.').reduce((current, name) => current?.[name], inst)
}

function pipeValidators(validators) {
  return function pipedValidators(...args) {
    for (const func of validators) {
      const result = func(...args)
      if (result) return result
    }
  }
}

// export function defaultValidateField(name, validate, values) {
//   if ()
// }
