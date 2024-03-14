import {
  createContext,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";

export const FormContext = createContext();

export function useForm({ initValues, validate, submit }) {
  const [values, setValues] = useState(initValues);

  const valuesRef = useRef(values);

  const actions = {
    change: (name, val) => {
      valuesRef.current[name] = val;
      setValues({ ...valuesRef.current });
    },
  };

  const Form = useCallback(() => {
    return function Form({ children }) {
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
      );
    };
  }, [actions.change]);

  return { Form };
}

export function useField(name) {
  const { values, actions } = useContext(FormContext);

  return {
    value: values[name],
    onChange: function onChange(value) {
      actions.change(name, value);
    },
  };
}
