import { getFieldFromInst, getFieldFromValidatorsMap, isPlainObj } from './util'
import {
  splitOnPathWithIndexes,
  replaceIOnNum,
  replaceIOnNumIfInArray,
  getLastArrayOfFieldName,
  getFieldNameWithoutI,
} from './arrays'
import {
  AdvancedValidator,
  ChildFields,
  StateRef,
  ValidateObj,
  ValidateObjItem,
  Validator,
  ValidatorsMap,
} from './types'

export const ADVANCED_VALIDATOR = Symbol('advanced validator')
export const ARRAY_FIELD = Symbol('array field')
export const VALIDATOR_INSTANCE = Symbol('validator instance')

export function getFieldsValidateOnChange(
  name: string,
  validatorsMap: ValidatorsMap,
  childFields: ChildFields,
  arrayFields: string[],
  stateRef: StateRef
): ValidateObj {
  const { validationEnabled } = stateRef.current
  const fieldsValidate: ValidateObj = {}

  if (validationEnabled[name]) {
    const validators = getFieldValidateObjOnChange(
      name,
      validatorsMap,
      arrayFields
    )
    if (validators) fieldsValidate[name] = validators
  }

  // array.0.name.oki.0.doki -> ['array', 'name.oki', 'doki'], [0, 0]
  const { indexes, path } = splitOnPathWithIndexes(name, arrayFields)
  const abstractFieldName = path.join('.i.').replaceAll('..', '.')

  if (childFields[abstractFieldName]) {
    for (let name of childFields[abstractFieldName]) {
      // ?TODO: array.1.i.name
      // parent для всех возможных i (array.1.0.name, array.1.1.name...)
      if (indexes.length) {
        // array.i.name -> array.1.name
        name = replaceIOnNum(name, indexes)
      }
      if (validationEnabled[name]) {
        const validators = getFieldValidateObjOnChange(
          name,
          validatorsMap,
          arrayFields
        )
        if (validators) fieldsValidate[name] = validators
      }
    }
  }

  return fieldsValidate
}

export function getFieldsValidateOnBlur(
  name: string,
  validatorsMap: ValidatorsMap,
  childFields: ChildFields,
  arrayFields: string[],
  stateRef: StateRef
): ValidateObj {
  const { validationEnabled } = stateRef.current
  const fieldsValidate: ValidateObj = {}

  fieldsValidate[name] = getFieldValidateObjOnBlur(
    name,
    validatorsMap,
    arrayFields
  )

  // array.0.name.oki.0.doki -> ['array', 'name.oki', 'doki'], [0, 0]
  const { indexes, path } = splitOnPathWithIndexes(name, arrayFields)
  const abstractFieldName = path.join('.i.').replaceAll('..', '.')

  if (childFields[abstractFieldName]) {
    for (let name of childFields[abstractFieldName]) {
      if (indexes.length) {
        // array.i.name -> array.1.name
        name = replaceIOnNum(name, indexes)
      }
      if (validationEnabled[name]) {
        fieldsValidate[name] = getFieldValidateObjOnBlur(
          name,
          validatorsMap,
          arrayFields
        )
      }
    }
  }

  return fieldsValidate
}

// submit
// пройтись по всем полям, добавляя валидаторы, если есть
// пройтись по всем валидаторам и добавить их для полей, которых нет в values
export function getFieldsValidateOnSubmit(
  validatorsMap: ValidatorsMap,
  arrayFields: string[],
  stateRef: StateRef
): ValidateObj {
  const fieldsValidate: ValidateObj = {}
  const abstractArrayFieldsValidators: Record<string, Validator<unknown>> = {}

  iterateValidatorsMap(validatorsMap, (path, val) => {
    const name = path.join('.')
    const parentArrayName = getLastArrayOfFieldName(name, arrayFields)
    if (!parentArrayName) {
      fieldsValidate[name] = getFieldValidateObjOnSubmit(name, val, arrayFields)
    } else {
      abstractArrayFieldsValidators[name] = val
    }
  })

  for (const abstractFieldName in abstractArrayFieldsValidators) {
    const path = abstractFieldName.replaceAll('.i.i.', '.i..i.').split('.i.')

    const concreteArrayFieldsValidators = getConcreteArrayFieldsValidators(
      path,
      stateRef,
      abstractArrayFieldsValidators[abstractFieldName]
    )
    for (const arrayFieldName in concreteArrayFieldsValidators) {
      fieldsValidate[arrayFieldName] = getFieldValidateObjOnSubmit(
        arrayFieldName,
        concreteArrayFieldsValidators[arrayFieldName],
        arrayFields
      )
    }
  }

  return fieldsValidate
}

function getFieldValidateObjOnChange(
  name: string,
  validatorsMap: ValidatorsMap,
  arrayFields: string[]
): ValidateObjItem | undefined {
  // array.1.name.1.oki -> array.name.oki
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromValidatorsMap(validatorName, validatorsMap)

  if (validator?.[ADVANCED_VALIDATOR]) {
    const validatorObj = validator[VALIDATOR_INSTANCE]
    // array.i.name -> array.1.name
    const parentsWithNumInArrays =
      validatorObj.PARENTS?.map((parentName: string) => {
        return replaceIOnNumIfInArray(arrayFields, parentName, name)
      }) || []

    if (typeof validatorObj.CHANGE === 'function')
      return {
        validators: [validatorObj.CHANGE],
        argsFields: [name, ...parentsWithNumInArrays],
      }
    return {
      validators: validatorObj.CHANGE,
      argsFields: [name, ...parentsWithNumInArrays],
    }
  } else if (Array.isArray(validator)) {
    return {
      validators: validator,
      argsFields: [name],
    }
  } else if (typeof validator === 'function')
    return {
      validators: [validator],
      argsFields: [name],
    }
}

function getFieldValidateObjOnBlur(
  name: string,
  validatorsMap: ValidatorsMap,
  arrayFields: string[]
): ValidateObjItem {
  // array.1.name.1.oki -> array.name.oki
  const validatorName = getValidatorName(name, arrayFields)
  const validator = getFieldFromValidatorsMap(validatorName, validatorsMap)
  if (validator?.[ADVANCED_VALIDATOR]) {
    const validatorObj = validator[VALIDATOR_INSTANCE]

    return {
      validators:
        typeof validatorObj.BLUR === 'function'
          ? [validatorObj.BLUR]
          : Array.isArray(validatorObj.BLUR)
          ? validatorObj.BLUR
          : [],
      argsFields: [
        name,
        ...validatorObj.PARENTS?.map((parentName: string) => {
          return replaceIOnNumIfInArray(arrayFields, parentName, name)
        }),
      ],
    }
  }

  return { validators: [], argsFields: [name] }
}

function getFieldValidateObjOnSubmit(
  name: string,
  validator: Validator<unknown>,
  arrayFields: string[]
): ValidateObjItem {
  if (Array.isArray(validator)) {
    return {
      validators: validator,
      argsFields: [name],
    }
  } else if (typeof validator === 'function') {
    return {
      validators: [validator],
      argsFields: [name],
    }
  } else {
    const validators = []
    if (Array.isArray(validator.CHANGE)) {
      validators.push(...validator.CHANGE)
    } else if (typeof validator.CHANGE === 'function') {
      validators.push(validator.CHANGE)
    }
    if (Array.isArray(validator.BLUR)) {
      validators.push(...validator.BLUR)
    } else if (typeof validator.BLUR === 'function') {
      validators.push(validator.BLUR)
    }
    if (Array.isArray(validator.SUBMIT)) {
      validators.push(...validator.SUBMIT)
    } else if (typeof validator.SUBMIT === 'function') {
      validators.push(validator.SUBMIT)
    }

    return {
      validators,
      argsFields: [
        name,
        ...(validator.PARENTS?.map((parentName) => {
          return replaceIOnNumIfInArray(arrayFields, parentName, name)
        }) || []),
      ],
    }
  }
}

function getConcreteArrayFieldsValidators(
  path: string[],
  stateRef: StateRef,
  validator: Validator<unknown>,
  currentPath: string = '',
  result: Record<string, Validator<unknown>> = {}
): Record<string, Validator<unknown>> {
  if (path.length === 1) {
    currentPath += `.${path[0]}`
    result[currentPath] = validator
    return result
  }

  const [current, ...remainingPath] = path

  const fields = getFieldFromInst(
    currentPath && current
      ? `${currentPath}.${current}`
      : current
      ? current
      : currentPath,
    stateRef.current.values
  ) as unknown[]

  fields.forEach((_, index) => {
    let newPath
    if (currentPath && current) {
      newPath = `${currentPath}.${current}.${index}`
    } else if (current) {
      newPath = `${current}.${index}`
    } else {
      newPath = `${currentPath}.${index}`
    }

    getConcreteArrayFieldsValidators(
      remainingPath,
      stateRef,
      validator,
      newPath,
      result
    )
  })

  return result
}

function iterateValidatorsMap(
  value: ValidatorsMap,
  cb: (path: string[], val: Validator<unknown>) => void,
  path: string[] = []
): void {
  if (isPlainObj(value)) {
    if (value[ADVANCED_VALIDATOR]) {
      cb(path, value[VALIDATOR_INSTANCE] as Validator<unknown>)
    } else {
      if (value[ARRAY_FIELD]) {
        iterateValidatorsMap(value[VALIDATOR_INSTANCE] as ValidatorsMap, cb, [
          ...path,
          'i',
        ])
      } else {
        for (let key in value) {
          iterateValidatorsMap(value[key] as ValidatorsMap, cb, [...path, key])
        }
      }
    }
  } else {
    cb(path, value)
  }
}

function getValidatorName(name: string, arrayFields: string[]): string {
  // array.1.name.1.oki -> array.i.name
  const lastArrayOfFieldName = getLastArrayOfFieldName(name, arrayFields)
  if (lastArrayOfFieldName) {
    // array.1.name.1.oki -> array.name.oki
    return getFieldNameWithoutI(name, lastArrayOfFieldName)
  } else return name
}

export function joinFieldsValidate(...validators: ValidateObj[]): ValidateObj {
  const result: ValidateObj = {}
  for (let validator of validators) {
    for (let name in validator) {
      if (!result[name]) result[name] = validator[name]
      else
        result[name].validators = [
          ...result[name].validators,
          ...validator[name].validators,
        ]
    }
  }
  return result
}

export const advanced = (advancedValidator: AdvancedValidator<unknown>) => ({
  [VALIDATOR_INSTANCE]: advancedValidator,
  [ADVANCED_VALIDATOR]: true,
})

export const array = (validatorsMap: ValidatorsMap) => ({
  [VALIDATOR_INSTANCE]: validatorsMap,
  [ARRAY_FIELD]: true,
})
