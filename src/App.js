import { useForm } from './useForm'
import { Input } from './Input'

function App() {
  const { Form, ...rest } = useForm({
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

  console.log(rest)

  return (
    <Form>
      <Input name="password" />
      <Input name="passwordRepeat" />
    </Form>
  )
}

export default App
