import { createContext, useCallback, useContext } from 'react'
import { useReducerWithRef } from './useReducerWithRef'
import { getValidateField } from './validate'

const getInitState = (initValues) =>
  initValues?.then
    ? initValues
    : {
        values: initValues,
        submitting: false,
        submitted: false,
        failed: false,
        defaultValidationEnabled: {},
        errors: {},
        loaders: {},
      }

export function useForm({ initValues, validate, submit }) {
  const [state, dispatch, stateRef] = useReducerWithRef(
    reducer,
    getInitState(initValues)
  )

  const actions = {
    change: useCallback((name, value) => {
      dispatch({
        type: 'change',
        name,
        value,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    enableDefaultValidation: useCallback((name) => {
      dispatch({
        type: 'enable default validation',
        name,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    validate: useCallback((name) => {
      const validate = getValidateField(name, validate)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    setLoader: useCallback((name, value) => {
      dispatch({
        type: 'change',
        name,
        value,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    setError: useCallback((name, value) => {
      dispatch({
        type: 'change',
        name,
        value,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  }

  const Form = useCallback(function Form({ children }) {
    return (
      <form>
        <FormContext.Provider
          value={{
            values: stateRef.current.values,
            actions: {
              change: actions.change,
            },
          }}
        >
          {children}
        </FormContext.Provider>
      </form>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { Form, state, actions }
}

export const FormContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'change': {
      const { name, value } = action
      return {
        ...state,
        values: {
          ...state.values,
          [name]: value,
        },
      }
    }
    case 'enable default validation': {
      const { name } = action
      return {
        ...state,
        defaultValidationEnabled: {
          ...state.defaultValidationEnabled,
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

export function useField(name) {
  const { values, actions } = useContext(FormContext)

  return {
    value: values[name],
    change: function onChange(value) {
      actions.change(name, value)
    },
  }
}
