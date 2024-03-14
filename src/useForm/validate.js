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

export function getValidateField(name, validate) {}
