import { createContext, useState, useCallback, useRef, useContext } from 'react'

export const FormContext = createContext()

export function useForm({ initValues, validate, submit }) {
  const [values, setValues] = useState(initValues)

  const valuesRef = useRef(values)

  const actions = {
    change: useCallback((name, val) => {
      valuesRef.current = { ...valuesRef.current }
      valuesRef.current[name] = val
      setValues(valuesRef.current)
    }, []),
  }

  const Form = useCallback(
    function Form({ children }) {
      return (
        <form>
          <FormContext.Provider
            value={{
              values: valuesRef.current,
              actions: {
                change: actions.change,
              },
            }}
          >
            {children}
          </FormContext.Provider>
        </form>
      )
    },
    [actions.change]
  )

  return { Form, values }
}

export function useField(name) {
  const { values, actions } = useContext(FormContext)
  console.log(name)

  return {
    value: values[name],
    change: function onChange(value) {
      actions.change(name, value)
    },
  }
}
