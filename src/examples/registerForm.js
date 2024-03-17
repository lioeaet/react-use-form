import { useForm, advanced } from './useForm'
import { Input } from './Input'

function App() {
  const { Form } = useForm({
    initValues: {
      password: '',
      passwordRepeat: '',
    },
    validators: {
      password: (val) => !val && 'should not be empty',
      passwordRepeat: advanced({
        DEFAULT: [
          (value) => !value && 'should not be empty',
          (val, password) => {
            // console.log(
            //   val,
            //   password,
            //   val !== password && 'should be equal with password'
            // )
            return val !== password && 'should be equal with password'
          },
        ],
        PARENTS: ['password'],
      }),
    },
    submit: console.log,
  })

  return (
    <Form>
      <Input name="password" />
      <Input name="passwordRepeat" />
    </Form>
  )
}

export default App
