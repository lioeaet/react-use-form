import { useForm } from './useForm'
import { Input } from './Input'

function App() {
  const { Form } = useForm({
    initValues: {
      password: '',
      passwordRepeat: '',
    },
    validate: {
      password: (val) => val || 'should not be empty',
      passwordRepeat: {
        DEFAULT: [
          (val) => val || 'should not be empty',
          (val, password) =>
            val === password || 'should be equal with password',
        ],
        PARENTS: ['password'],
      },
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
