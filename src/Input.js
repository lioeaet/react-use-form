import { useField } from './useForm'

export function Input(name) {
  const field = useField(name)

  return (
    <input value={field.value} onChange={(e) => field.change(e.target.value)} />
  )
}
