import { createContext, useCallback, useContext, useRef } from 'react'
import { useReducerWithRef } from './useReducerWithRef'
import {
  ADVANCED_VALIDATOR,
  ARRAY_FIELD,
  getFieldsValidateOnChange,
  getFieldsValidateOnValidate,
} from './validate'
import { iterateDeep, getFieldFromInst, splitFieldOfArrayName } from './util'
import { getReducer } from './reducer'

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

export function useForm({ initValues, validators, submit }) {
  // [{ arrFieldName, type, args }]
  const replacementsDuringValidationRef = useRef([])

  // для ликвидации состояния гонки
  const lastValidateObjRef = useRef({})

  // для отмены валидации уже валидированных значений
  const lastValidatedValuesRef = useRef({})

  const [state, dispatch, stateRef] = useReducerWithRef(
    getReducer(
      replacementsDuringValidationRef,
      lastValidatedValuesRef,
      lastValidateObjRef
    ),
    getInitState(initValues)
  )

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
      execValidateObject(fieldsValidateOnChange, stateRef)
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

      execValidateObject(
        joinValidators(fieldsValidateOnChange, fieldsValidateOnValidate),
        stateRef
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

  function execValidateObject(validateObj, stateRef) {
    const fieldsErrors = {}
    const fieldsPromises = {}

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

    // при первой ошибке, показываем её и ставим setLoading(false)
    // (остальные валидации после этого игнорируем)
    // при последней асинхронной валидации
    // если ошибки нет в ней и в fieldsErrors[fieldName]
    // ставим setLoading(false) и setError(null)
    // если нет асинхронных валидаций,
    // то setError(null) делаем на последней синхронной валидации
    // а setLoading трогаем

    outer: for (let fieldName in validateObj) {
      const { validators, argsFields } = validateObj[fieldName]
      const values = argsFields.map((field) =>
        getFieldFromInst(field, stateRef.current.values)
      )

      const shouldValidate =
        !lastValidatedValuesRef.current[fieldName] ||
        lastValidatedValuesRef.current[fieldName].some(
          (val, i) => val !== values[i]
        )
      if (!shouldValidate) {
        fieldsErrors[fieldName] = fieldsPromises[fieldName] =
          stateRef.current.errors[fieldName]
        continue
      }

      lastValidateObjRef.current[fieldName] = validateObj[fieldName]
      lastValidatedValuesRef.current[fieldName] = values

      let resolveValidationPromise
      let promisesCount = 0

      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i]
        const result = validator(...values)

        if (result?.then) {
          if (!promisesCount) actions.setLoader(fieldName, true)
          promisesCount++
          if (!fieldsPromises[fieldName]) {
            // eslint-disable-next-line no-loop-func
            fieldsPromises[fieldName] = new Promise((r) => {
              resolveValidationPromise = r
            })
          }
          // eslint-disable-next-line no-loop-func
          result.then((error) => {
            const arrayOfFieldName = arrayFields.find((arrField) =>
              fieldName.startsWith(arrField)
            )
            let actualFieldName = fieldName
            if (arrayOfFieldName) {
              actualFieldName = updNameWithArrayReplacements(
                arrayOfFieldName,
                fieldName,
                replacementsDuringValidation
              )
              if (!actualFieldName) return
            }

            if (fieldsErrors[actualFieldName]) return
            if (
              lastValidateObjRef.current[actualFieldName] !==
              validateObj[fieldName]
            )
              return

            --promisesCount

            if (error) {
              fieldsErrors[actualFieldName] = error
              actions.setError(actualFieldName, error)
              actions.setLoader(actualFieldName, false)
              removeReplacementsDuringValidation()
              resolveValidationPromise(error)
            } else if (!promisesCount) {
              actions.setError(actualFieldName, null)
              actions.setLoader(actualFieldName, false)
              removeReplacementsDuringValidation()
              resolveValidationPromise(null)
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
            if (resolveValidationPromise) resolveValidationPromise(result)
            continue outer
          } else if (!promisesCount && i === validators.length - 1) {
            actions.setError(fieldName, null)
            if (resolveValidationPromise) resolveValidationPromise(null)
          }
        }
      }
    }
    const promisesArr = Object.values(fieldsPromises)
    return Promise.all(promisesArr)
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

function updNameWithArrayReplacements(
  arrayOfFieldName,
  fieldName,
  replacementsDuringValidation
) {
  return replacementsDuringValidation.reduce((nextFieldName, arrayAction) => {
    if (!nextFieldName) return nextFieldName

    switch (arrayAction.type) {
      case 'remove': {
        const { i } = arrayAction.args
        const { num, fieldEndPart } = splitFieldOfArrayName(
          arrayAction.name,
          nextFieldName
        )
        if (num === i) return null
        else if (num > i)
          return `${arrayAction.name}.${num - 1}.${fieldEndPart}`
        return nextFieldName
      }
      default:
        return nextFieldName
    }
  }, fieldName)
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
