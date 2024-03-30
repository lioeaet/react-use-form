import { createContext, useCallback, useContext, useRef } from 'react'
import { useReducerWithRef } from './useReducerWithRef'
import {
  ADVANCED_VALIDATOR,
  ARRAY_FIELD,
  getFieldsValidateOnChange,
  getFieldsValidateOnValidate,
} from './validate'
import { iterateDeep, clone, getFieldFromInst, setFieldToInst } from './util'

const getInitState = (initValues) =>
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

// совмещение асинхронной валидации с изменениями в массивах
// (изменение имени поля для setError)

// при changeOrder может измениться порядок
// и валидация должна примениться к новым полям

// orderUpdates = { arrayPath: iterationCount }

// iterationCount
// from iterationCount

export function useForm({ initValues, validators, submit }) {
  // [{ arrFieldName, type, args }]
  const replacementsDuringValidationRef = useRef([])

  const [state, dispatch, stateRef] = useReducerWithRef(
    getReducer(replacementsDuringValidationRef),
    getInitState(initValues)
  )
  // для ликвидации состояния гонки
  const lastValidateObjRef = useRef({})

  const { childFields, arrayFields } = useChildAndArrayFields(validators)

  const actions = {
    change: useCallback((name, value) => {
      dispatch({
        type: 'change',
        name,
        value,
      })

      // валидируются
      // 1. Само поле name по default если validationEnabled
      // 2. Зависимые поля по default, если у них validationEnabled
      const fieldsValidateOnChange = getFieldsValidateOnChange(
        name,
        validators,
        childFields,
        stateRef,
        arrayFields
      )
      execValidateObject(fieldsValidateOnChange)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    spliceArray: useCallback(() => {}, []),
    blur: useCallback((name) => {
      dispatch({
        type: 'enable validation',
        name,
      })

      const fieldsValidateOnChange = getFieldsValidateOnChange(
        name,
        validators,
        childFields,
        stateRef,
        arrayFields
      )

      const fieldsValidateOnValidate = getFieldsValidateOnValidate(
        name,
        validators,
        childFields,
        stateRef
      )
      console.log(fieldsValidateOnChange, fieldsValidateOnValidate)

      execValidateObject(
        joinValidators(fieldsValidateOnChange, fieldsValidateOnValidate)
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    validate: useCallback((name) => {
      // const validateField = getValidateField(name, validators)
      // validateField()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    submit: () => {
      dispatch({
        type: 'submit start',
      })
      return submit(stateRef.current.values)
        .then((res) => {})
        .catch((e) => {})
    },
    setLoader: useCallback((name, loader) => {
      dispatch({
        type: 'set loader',
        name,
        loader,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    setError: useCallback((name, error) => {
      dispatch({
        type: 'set error',
        name,
        error,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    reset: useCallback((initValues) => {
      dispatch({
        type: 'reset',
        initValues,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    push: useCallback((name, value) => {
      dispatch({
        type: 'push',
        name,
        value,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    remove: useCallback((name, i) => {
      dispatch({
        type: 'remove',
        name,
        i,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  }

  function execValidateObject(validateObj) {
    const fieldsErrors = {}

    // если во время валидации произошли изменения индексов в массивах
    // применяем их к fieldName внутри валидаций
    const replacementsDuringValidation = []
    replacementsDuringValidationRef.current.push(replacementsDuringValidation)
    function removeReplacementsDuringValidation() {
      const i = replacementsDuringValidationRef.current.indexOf(
        replacementsDuringValidation
      )
      replacementsDuringValidationRef.current.splice(i, 1)
    }

    // при первой ошибке нужно её показать и сделать setLoading(false)
    // (остальные валидации после этого игнорируем)
    // при последней асинхронной валидации нужно
    // если ошибки нет в ней и в fieldsErrors[fieldName]
    // поставить setLoading(false) и setError(null)
    // если нет асинхронных валидаций,
    // то setError(null) нужно делать на последней синхронной валидации
    // а setLoading трогать не нужно

    outer: for (let fieldName in validateObj) {
      const { validators, argsFields } = validateObj[fieldName]
      lastValidateObjRef.current[fieldName] = validateObj[fieldName]
      const values = argsFields.map((field) =>
        getFieldFromInst(field, stateRef.current.values)
      )
      let promisesCount = 0

      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i]
        const result = validator(...values)

        if (result?.then) {
          if (!promisesCount) actions.setLoader(fieldName, true)
          promisesCount++

          // eslint-disable-next-line no-loop-func
          result.then((error) => {
            const isInArray = arrayFields.some((arrField) =>
              fieldName.startsWith(arrField)
            )
            if (isInArray) {
              console.log(true)
            }
            // if isInArray(fieldName)
            // fieldName = updName(replacementsDuringValidation)

            if (fieldsErrors[fieldName]) return
            if (
              lastValidateObjRef.current[fieldName] !== validateObj[fieldName]
            )
              return
            --promisesCount
            if (error) {
              fieldsErrors[fieldName] = error
              actions.setError(fieldName, error)
              actions.setLoader(fieldName, false)
              removeReplacementsDuringValidation()
            } else if (!promisesCount) {
              actions.setError(fieldName, null)
              actions.setLoader(fieldName, false)
              removeReplacementsDuringValidation()
            }
          })
        } else {
          if (result) {
            fieldsErrors[fieldName] = result
            actions.setError(fieldName, result)
            if (promisesCount) {
              actions.setLoader(fieldName, false)
              removeReplacementsDuringValidation()
            }
            continue outer
          } else if (!promisesCount && i === validators.length - 1) {
            actions.setError(fieldName, null)
          }
        }
      }
    }
  }

  const Form = useCallback(function Form({ children }) {
    return (
      <form>
        <FormContext.Provider
          value={{
            ...stateRef.current,
            actions,
          }}
        >
          {children}
        </FormContext.Provider>
      </form>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { Form, actions, state }
}

export const FormContext = createContext()

function getReducer(replacementsDuringValidationRef) {
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
        const nextValues = clone(state.values)
        const arr = getFieldFromInst(name, state.values)
        setFieldToInst(
          name,
          arr.filter((_, j) => i !== j),
          nextValues
        )
        replacementsDuringValidationRef.current.forEach(
          (replacementsDuringValidation) => {
            replacementsDuringValidation.push({
              type: 'remove',
              name,
              args: { i },
            })
          }
        )
        return {
          ...state,
          values: nextValues,
        }
      }
      default:
        throw new Error('unknown action')
    }
  }
}

function joinValidators(...validators) {
  const result = {}
  for (let validator of validators) {
    for (let fieldName in validator) {
      if (!result[fieldName]) result[fieldName] = validator[fieldName]
      else
        result[fieldName].validators = [
          ...result[fieldName].validators,
          ...validator[fieldName].validators,
        ]
    }
  }
  return result
}

function useChildAndArrayFields(validators) {
  const childFields = {}
  const arrayFields = []

  iterateDeep(validators, (path, val) => {
    if (val?.[ADVANCED_VALIDATOR]) {
      val.PARENTS?.forEach?.((parentName) => {
        if (!childFields[parentName]) childFields[parentName] = [path.join('.')]
        else childFields.push(path.join('.'))
      })
    } else if (val?.[ARRAY_FIELD]) {
      arrayFields.push(path.join('.'))
    }
  })

  return { childFields, arrayFields }
}

export function useField(name) {
  const { values, errors, loaders, actions } = useContext(FormContext)

  return {
    value: getFieldFromInst(name, values),
    error: errors[name],
    loading: loaders[name],
    onChange: function onChange(value) {
      actions.change(name, value)
    },
    onBlur: function onEnableValidation() {
      actions.blur(name)
    },
  }
}

export function useSubformsArray(name) {
  const { values, actions } = useContext(FormContext)
  return {
    value: getFieldFromInst(name, values),
    remove: (i) => actions.remove(name, i),
    push: (value) => actions.push(name, value),
  }
}

export const advanced = (validatorObj) => ({
  ...validatorObj,
  [ADVANCED_VALIDATOR]: true,
})

export const array = (validatorObj) => ({
  ...validatorObj,
  [ARRAY_FIELD]: true,
})
