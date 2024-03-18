import { useForm, advanced } from './useForm'
import { Input } from './Input'

function App() {
  const { Form } = useForm({
    initValues: {
      password: '',
      passwordRepeat: '',
    },
    validators: {
      password: (val) =>
        new Promise((r) => r()).then(() => !val && 'should not be empty'),
      passwordRepeat: advanced({
        DEFAULT: [
          (value) => {
            return !value && 'should be filled'
            // new Promise((r) => r()).then(
            //   () =>
            // )
          },
          (val, password) => {
            // console.log(
            //   val,
            //   password,
            //   val !== password && 'should be equal with password'
            // )
            return new Promise((r) => r()).then(
              () => val !== password && 'should be equal with password'
            )
          },
        ],
        VALIDATE: [
          (value, password) => {
            return new Promise((r) => r()).then(
              () =>
                Boolean(value === password) &&
                'should not be equal with password'
            )
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
