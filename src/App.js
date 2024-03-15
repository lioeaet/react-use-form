import { useForm } from './useForm'
import { Input } from './Input'

function App() {
  const { Form } = useForm({
    initValues: {
      password: '',
      passwordRepeat: '',
    },
    validate: {
      password: () => {},
      passwordRepeat: () => {},
    },
    submit: console.log,
  })

  return (
    <Form>
      <Input name="password" />
      <Input name="password.repeat" />
    </Form>
  )
}

export default App
