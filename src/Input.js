import { useField } from './useForm'

export function Input({ name, val, setVal }) {
  const { value, error, onChange } = useField(name)
  console.log(error)
  return (
    <div>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <div>{error}</div>
    </div>
  )
}
