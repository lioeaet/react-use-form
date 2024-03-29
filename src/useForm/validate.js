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
    const validate = getFieldValidatorsDefault(name, validators)
    if (validate) fieldsValidate[name] = validate
  }

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        const validate = getFieldValidatorsDefault(fieldName, validators)
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

function getFieldValidatorsDefault(name, validators) {
  const validator = getFieldFromInst(name, validators)

  if (validator?.[ADVANCED_VALIDATOR]) {
    if (typeof validator.DEFAULT === 'function')
      return {
        validators: [validator.DEFAULT],
        argsFields: [name, ...validator.PARENTS],
      }
    return {
      validators: validator.DEFAULT,
      argsFields: [name, ...validator.PARENTS],
    }
  } else if (Array.isArray(validator)) {
    return { validators: validator, argsFields: [name] }
  } else if (typeof validator === 'function')
    return { validator: [validators.DEFAULT], argsFields: [name] }
}

function getValidateFieldAdvanced(name, validators, type) {
  const validator = getFieldFromInst(name, validators)
  if (!validator?.[type]) return () => {}

  return getPipedValidators(validator.VALIDATE, validator.PARENTS)
}

function getPipedValidators(validators, parents) {
  async function pipedValidators(...args) {
    for (let i = 0; i < validators.length; i++) {
      const result = validators[i](...args)
      if (result?.then) {
        return result.then((asyncResult) => {
          if (asyncResult) return asyncResult
          else {
            const nextPipedValidators = getPipedValidators(
              validators.slice(i + 1, validators.length),
              parents
            )
            return nextPipedValidators(...args)
          }
        })
      } else if (result) {
        return result
      }
    }
  }
  pipedValidators[ADVANCED_VALIDATOR] = true
  pipedValidators.PARENTS = parents
  return pipedValidators
}

// export function getFieldsValidateOnSubmit(name, validators, childFields) {
//   const fieldsValidate = {}
//
//   fieldsValidate[name] = getValidateFieldAdvanced(name, validators, 'SUBMIT')
//
//   if (childFields[name]) {
//     for (const fieldName of childFields[name]) {
//       fieldsValidate[fieldName] = getValidateFieldAdvanced(
//         fieldName,
//         validators,
//         'SUBMIT'
//       )
//     }
//   }
//
//   return fieldsValidate
// }

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
