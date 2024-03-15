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

// password, password.repeat, passwords[12].repeat
export function getValidateField(name, validators) {
  return name
    .split('.')
    .reduce(
      (current, name) =>
        typeof current === 'function' || current?.type === ADVANCED_VALIDATOR
          ? current
          : current?.[name],
      validators
    )
}

export function defaultValidateField(name, values, validateField) {}

export function getFieldFromInst(name, inst) {
  return name.split('.').reduce((current, name) => current?.[name], inst)
}

// export function defaultValidateField(name, validate, values) {
//   if ()
// }
