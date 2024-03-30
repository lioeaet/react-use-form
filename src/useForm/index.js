import { createContext, useCallback, useContext, useRef } from 'react'
import { useReducerWithRef } from './useReducerWithRef'
import {
  ADVANCED_VALIDATOR,
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
  const [state, dispatch, stateRef] = useReducerWithRef(
    reducer,
    getInitState(initValues)
  )
  // для ликвидации состояния гонки
  const lastValidateObjRef = useRef({})

  const childFields = useChildFields(validators)

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
        stateRef
      )
      execValidateObject(fieldsValidateOnChange)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    sort: useCallback((name) => {
      return // { prevIdx: newIdx }
    }, []),
    spliceArray: useCallback(() => {}, []),
    enableValidation: useCallback((name) => {
      dispatch({
        type: 'enable validation',
        name,
      })

      const fieldsValidateOnChange = getFieldsValidateOnChange(
        name,
        validators,
        childFields,
        stateRef
      )

      const fieldsValidateOnValidate = getFieldsValidateOnValidate(
        name,
        validators,
        childFields,
        stateRef
      )

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
    submit: useCallback(() => {
      dispatch({
        type: 'submit start',
      })
      return submit(stateRef.current.values)
        .then((res) => {})
        .catch((e) => {})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
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
    reset: useCallback(() => {
      dispatch({
        type: 'reset',
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  }

  function execValidateObject(validateObj) {
    const fieldsErrors = {}

    // при первой ошибке нужно её показать и сделать setLoading(false)
    // (остальные валидации игнорируем)
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
            console.log(error)
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
            } else if (!promisesCount) {
              actions.setError(fieldName, null)
              actions.setLoader(fieldName, false)
            }
          })
        } else {
          if (result) {
            if (promisesCount) {
              actions.setLoader(fieldName, false)
            }
            fieldsErrors[fieldName] = result
            actions.setError(fieldName, result)
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

function reducer(state, action) {
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
    default:
      throw new Error('unknown action')
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

function useChildFields(validators) {
  const childFields = {}

  iterateDeep(validators, (path, val) => {
    if (val?.[ADVANCED_VALIDATOR]) {
      val.PARENTS?.forEach?.((parentName) => {
        if (!childFields[parentName]) childFields[parentName] = [path.join('.')]
        else childFields.push(path.join('.'))
      })
    }
  })

  return childFields
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
      actions.enableValidation(name)
    },
  }
}

export const advanced = (validatorObj) => ({
  ...validatorObj,
  [ADVANCED_VALIDATOR]: true,
})
