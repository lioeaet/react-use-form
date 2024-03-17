import { useField } from './useForm'

export function Input({ name, val, setVal }) {
  const { value, error, onChange, onEnableValidation } = useField(name)
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onEnableValidation}
      />
      <div>{error}</div>
    </div>
  )
}
