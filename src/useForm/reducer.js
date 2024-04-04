import {
  clone,
  getFieldFromInst,
  setFieldToInst,
  splitFieldOfArrayName,
  iterateDeep,
} from './util'

export const getInitState = (initValues) =>
  initValues?.then
    ? initValues
    : {
        values: initValues,
        submitting: false,
        submitted: false,
        failedError: null,
        validationEnabled: {},
        errors: {},
        loaders: {},
      }

export function getReducer(
  replacementsDuringValidationRef,
  lastValidatedValuesRef,
  lastValidateObjRef,
  arrayFields
) {
  return function reducer(state, action) {
    switch (action.type) {
      case 'change': {
        const { name, value } = action

        const nextValues = clone(state.values)
        setFieldToInst(name, value, nextValues)

        return {
          ...state,
          values: nextValues,
          failedError: null,
        }
      }
      case 'enable validation': {
        const { name } = action
        return {
          ...state,
          validationEnabled: {
            ...state.validationEnabled,
            [name]: true,
          },
        }
      }
      case 'set error': {
        const { name, error } = action
        return {
          ...state,
          errors: {
            ...state.errors,
            [name]: error,
          },
        }
      }
      case 'set loader': {
        const { name, loader } = action
        return {
          ...state,
          loaders: {
            ...state.loaders,
            [name]: loader,
          },
        }
      }
      case 'reset': {
        const { initValues } = action
        return getInitState(initValues)
      }
      // array methods
      case 'array insert': {
        const { name, value, i } = action
        const nextState = clone(state)
        const array = getFieldFromInst(name, state.values)
        const nextArray = [...array.slice(0, i), value, ...array.slice(i + 1)]

        setFieldToInst(name, nextArray, nextState.values)

        const nextLastValidatedValues = {}
        const nextLastValidateObj = {}

        incrementArrayNamesAfterI(
          name,
          i,
          state,
          nextState,
          lastValidatedValuesRef.current,
          nextLastValidatedValues,
          lastValidateObjRef.current,
          nextLastValidateObj
        )
        lastValidatedValuesRef.current = nextLastValidatedValues
        lastValidateObjRef.current = nextLastValidateObj

        replacementsDuringValidationRef.current.forEach(
          (replacementsDuringValidation) => {
            replacementsDuringValidation.push({
              type: 'array insert',
              name,
              args: { i },
            })
          }
        )

        return nextState
      }
      case 'array replace': {
        const { name, from, to } = action
        const nextValues = clone(state.values)
        const array = getFieldFromInst(name, state.values)
        // setFieldToInst(name, [...array, value], nextValues)
        return {
          ...state,
          values: nextValues,
        }
      }
      case 'array remove': {
        const { name, i } = action
        const nextState = clone(state)
        const array = getFieldFromInst(name, state.values)
        // почистить loaders, errors
        // переместить поля в loaders, errors и validationEnabled после i на 1 field вверх
        // переместить поля в lastValidatedValues и lastValidateObj после i на 1 вверх
        setFieldToInst(
          name,
          array.filter((_, j) => i !== j),
          nextState.values
        )

        const nextLastValidatedValues = {}
        const nextLastValidateObj = {}

        decrementArrayNamesAfterI(
          name,
          i,
          state,
          nextState,
          lastValidatedValuesRef.current,
          nextLastValidatedValues,
          lastValidateObjRef.current,
          nextLastValidateObj
        )
        lastValidatedValuesRef.current = nextLastValidatedValues
        lastValidateObjRef.current = nextLastValidateObj

        replacementsDuringValidationRef.current.forEach(
          (replacementsDuringValidation) => {
            replacementsDuringValidation.push({
              type: 'array remove',
              name,
              args: { i },
            })
          }
        )
        return nextState
      }
      case 'submit start': {
        const nextValidationEnabled = {}
        iterateDeep(state.values, (path, val) => {
          const fieldName = path.join('.')
          const possibleArrayFieldName = path.join('.')
          const possibleArrayWithElemFieldName = path
            .slice(0, path.length - 1)
            .join('.')

          if (
            fieldName &&
            !arrayFields.some((arrayField) =>
              [possibleArrayFieldName, possibleArrayWithElemFieldName].includes(
                arrayField
              )
            )
          ) {
            nextValidationEnabled[fieldName] = true
          }
        })

        return {
          ...state,
          validationEnabled: nextValidationEnabled,
          submitting: true,
          submitted: false,
          failedError: null,
        }
      }
      case 'submit success': {
        return {
          ...state,
          submitting: false,
          submitted: true,
        }
      }
      case 'submit failure': {
        return {
          ...state,
          submitting: false,
          failedError: true,
        }
      }
      default:
        throw new Error('unknown action')
    }
  }
}

function decrementArrayNamesAfterI(
  arrayName,
  i,
  oldState,
  newState,
  oldLastValidatedValues,
  newLastValidatedValues,
  oldLastValidateObj,
  newLastValidateObj
) {
  const newLoaders = {}
  const newErrors = {}
  const newValidationEnabled = {}
  processRemoveInInst(arrayName, i, oldState.loaders, newLoaders)
  newState.loaders = newLoaders

  processRemoveInInst(arrayName, i, oldState.errors, newErrors)
  newState.errors = newErrors

  processRemoveInInst(
    arrayName,
    i,
    oldState.validationEnabled,
    newValidationEnabled
  )
  newState.validationEnabled = newValidationEnabled

  processRemoveInInst(
    arrayName,
    i,
    oldLastValidatedValues,
    newLastValidatedValues
  )
  processRemoveInInst(arrayName, i, oldLastValidateObj, newLastValidateObj)

  return newState
}

function processRemoveInInst(arrayName, i, oldSrc, newSrc) {
  for (const fieldName in oldSrc) {
    if (fieldName.startsWith(arrayName)) {
      const { num, fieldEndPart } = splitFieldOfArrayName(arrayName, fieldName)
      if (num === i) {
        delete newSrc[fieldName]
      } else if (num > i) {
        const newFieldName = `${arrayName}.${num - 1}.${fieldEndPart}`
        newSrc[newFieldName] = oldSrc[fieldName]
      } else {
        newSrc[fieldName] = oldSrc[fieldName]
      }
    }
  }
}

function incrementArrayNamesAfterI(
  arrayName,
  i,
  oldState,
  newState,
  oldLastValidatedValues,
  newLastValidatedValues,
  oldLastValidateObj,
  newLastValidateObj
) {
  const newLoaders = {}
  const newErrors = {}
  const newValidationEnabled = {}
  processInsertInInst(arrayName, i, oldState.loaders, newState.loaders)
  newState.loaders = newLoaders

  processInsertInInst(arrayName, i, oldState.errors, newState.errors)
  newState.errors = newErrors

  processInsertInInst(
    arrayName,
    i,
    oldState.validationEnabled,
    newState.validationEnabled
  )
  newState.validationEnabled = newValidationEnabled

  processInsertInInst(
    arrayName,
    i,
    oldLastValidatedValues,
    newLastValidatedValues
  )
  processInsertInInst(arrayName, i, oldLastValidateObj, newLastValidateObj)
}

function processInsertInInst(arrayName, i, oldSrc, newSrc) {
  for (const fieldName in oldSrc) {
    if (fieldName.startsWith(arrayName)) {
      const { num, fieldEndPart } = splitFieldOfArrayName(arrayName, fieldName)
      if (num >= i) {
        const newFieldName = `${arrayName}.${num + 1}.${fieldEndPart}`
        newSrc[newFieldName] = oldSrc[fieldName]
      } else {
        newSrc[fieldName] = oldSrc[fieldName]
      }
    }
  }
}
