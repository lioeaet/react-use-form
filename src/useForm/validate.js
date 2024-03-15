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

export function getValidateField(
  name,
  validate,
  values,
  defaultValidationActiveFields
) {
  return name.split('.').reduce((current, name) => {
    if (typeof current === 'function' || current.type === ADVANCED_VALIDATOR)
      return current
    return current[name]
  }, validate)
}

export function defaultValidateField(name, validate, values) {}
