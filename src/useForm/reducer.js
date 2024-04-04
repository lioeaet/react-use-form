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

        const nextLastValidatedValues = { ...lastValidatedValuesRef.current }
        const nextLastValidateObj = { ...lastValidateObjRef.current }

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

        const nextLastValidatedValues = { ...lastValidatedValuesRef.current }
        const nextLastValidateObj = { ...lastValidateObjRef.current }

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
  processRemoveInInst(arrayName, i, oldState.loaders, newState.loaders)
  processRemoveInInst(arrayName, i, oldState.errors, newState.errors)
  processRemoveInInst(
    arrayName,
    i,
    oldState.validationEnabled,
    newState.validationEnabled
  )
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
  for (const fieldName in newSrc) {
    if (fieldName.startsWith(arrayName)) {
      const { num, fieldEndPart } = splitFieldOfArrayName(arrayName, fieldName)
      if (num === i) {
        delete newSrc[fieldName]
      } else if (num > i) {
        const newFieldName = `${arrayName}.${num - 1}.${fieldEndPart}`
        newSrc[newFieldName] = oldSrc[fieldName]
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
  processInsertInInst(arrayName, i, oldState.loaders, newState.loaders)
  processInsertInInst(arrayName, i, oldState.errors, newState.errors)
  processInsertInInst(
    arrayName,
    i,
    oldState.validationEnabled,
    newState.validationEnabled
  )
  processInsertInInst(
    arrayName,
    i,
    oldLastValidatedValues,
    newLastValidatedValues
  )
  processInsertInInst(arrayName, i, oldLastValidateObj, newLastValidateObj)
}

function processInsertInInst(arrayName, i, oldSrc, newSrc) {
  for (const fieldName in newSrc) {
    if (fieldName.startsWith(arrayName)) {
      const { num, fieldEndPart } = splitFieldOfArrayName(arrayName, fieldName)
      if (num >= i) {
        const newFieldName = `${arrayName}.${num + 1}.${fieldEndPart}`
        newSrc[newFieldName] = oldSrc[fieldName]
      }
    }
  }
}
