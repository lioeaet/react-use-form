import { useField } from './useForm'

export function Input({ name, val, setVal }) {
  const { value, error, loading, onChange, onEnableValidation } = useField(name)
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onEnableValidation}
        />
        {loading && 'loading...'}
      </div>
      <div>{error}</div>
    </div>
  )
}
