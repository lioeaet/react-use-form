import {
  clone,
  getFieldFromInst,
  setFieldToInst,
  splitFieldOfArrayName,
} from './util'
import { getInitState } from './index.js'

export function getReducer(
  replacementsDuringValidationRef,
  lastValidatedValuesRef
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
      case 'push': {
        const { name, value } = action
        const nextValues = clone(state.values)
        const arr = getFieldFromInst(name, state.values)
        setFieldToInst(name, [...arr, value], nextValues)
        return {
          ...state,
          values: nextValues,
        }
      }
      case 'unshift': {
        const { name, value } = action
        const nextValues = clone(state.values)
        const arr = getFieldFromInst(name, state.values)
        setFieldToInst(name, [value, ...arr], nextValues)
        return {
          ...state,
          values: nextValues,
        }
      }
      case 'remove': {
        const { name, i } = action
        const nextState = clone(state)
        const arr = getFieldFromInst(name, state.values)
        // почистить loaders, errors
        // переместить loaders и errors после i на 1 field вверх
        setFieldToInst(
          name,
          arr.filter((_, j) => i !== j),
          nextState.values
        )

        const nextLastValidatedValues = { ...lastValidatedValuesRef.current }
        decrementArrayLoadersAndErrorsAfterI(
          state,
          nextState,
          lastValidatedValuesRef.current,
          nextLastValidatedValues,
          name,
          i
        )
        lastValidatedValuesRef.current = nextLastValidatedValues

        replacementsDuringValidationRef.current.forEach(
          (replacementsDuringValidation) => {
            replacementsDuringValidation.push({
              type: 'remove',
              name,
              args: { i },
            })
          }
        )
        return nextState
      }
      default:
        throw new Error('unknown action')
    }
  }
}

function decrementArrayLoadersAndErrorsAfterI(
  oldState,
  newState,
  oldLastValidatedValues,
  newLastValidatedValues,
  name,
  i
) {
  decrementArrayFieldsAfterI(name, i, oldState.loaders, newState.loaders)
  decrementArrayFieldsAfterI(name, i, oldState.errors, newState.errors)
  decrementArrayFieldsAfterI(
    name,
    i,
    oldLastValidatedValues,
    newLastValidatedValues
  )

  return newState
}

function decrementArrayFieldsAfterI(name, i, oldSrc, newSrc) {
  for (const fieldName in newSrc) {
    if (fieldName.startsWith(name)) {
      const { num, fieldEndPart } = splitFieldOfArrayName(name, fieldName)
      if (num === i) {
        delete newSrc[fieldName]
      } else if (num > i) {
        const newFieldName = `${name}.${num - 1}.${fieldEndPart}`
        newSrc[newFieldName] = oldSrc[fieldName]
        delete newSrc[fieldName]
      }
    }
  }
}
