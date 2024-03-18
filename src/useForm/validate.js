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
  stateRef,
  validationCountRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  if (validationEnabled[name]) {
    const validate = getValidateFieldDefault(
      name,
      validators,
      validationCountRef
    )
    if (validate) fieldsValidate[name] = validate
  }

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        const validate = getValidateFieldDefault(
          fieldName,
          validators,
          validationCountRef
        )
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
  stateRef,
  validationCountRef
) {
  const { validationEnabled } = stateRef.current
  const fieldsValidate = {}

  fieldsValidate[name] = getValidateFieldAdvanced(
    name,
    validators,
    'VALIDATE',
    validationCountRef
  )

  if (childFields[name]) {
    for (const fieldName of childFields[name]) {
      if (validationEnabled[fieldName]) {
        fieldsValidate[fieldName] = getValidateFieldAdvanced(
          fieldName,
          validators,
          'VALIDATE',
          validationCountRef
        )
      }
    }
  }

  return fieldsValidate
}

function getValidateFieldDefault(name, validators, validationCountRef) {
  const validator = getFieldFromInst(name, validators)

  if (validator?.DEFAULT) {
    if (typeof validator.DEFAULT === 'function') return validator.DEFAULT
    return getPipedValidators(
      validator.DEFAULT,
      validator.PARENTS,
      validationCountRef.current,
      validationCountRef
    )
  } else if (typeof validator === 'function') return validator
}

function getValidateFieldAdvanced(name, validators, type, validationCountRef) {
  const validator = getFieldFromInst(name, validators)
  if (!validator?.[type]) return () => {}

  return getPipedValidators(
    validator.VALIDATE,
    validator.PARENTS,
    validationCountRef.current,
    validationCountRef
  )
}

function getPipedValidators(
  validators,
  parents,
  validationCount,
  validationCountRef
) {
  async function pipedValidators(...args) {
    for (let i = 0; i < validators.length; i++) {
      const result = validators[i](...args)
      if (result?.then) {
        return result.then((asyncResult) => {
          if (asyncResult) return asyncResult
          else if (validationCountRef.current !== validationCount) {
            throw VALIDATORS_DISABLING
          } else {
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

const VALIDATORS_DISABLING = Symbol('validators disabling')

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
