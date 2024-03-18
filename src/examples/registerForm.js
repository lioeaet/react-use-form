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
        new Promise((r) => r()).then(!val && 'should not be empty'),
      passwordRepeat: advanced({
        DEFAULT: [
          (value) => !value && 'should not be empty',
          // new Promise((r) => r()).then(
          // (val, password) => {
          // console.log(
          //   val,
          //   password,
          //   val !== password && 'should be equal with password'
          // )
          // return val !== password && 'should be equal with password'
          // } /* ) */,
        ],
        VALIDATE: [
          (val, password) => {
            console.log(
              val,
              password,
              val !== password && 'should be equal with password'
            )
            return new Promise((r) => r()).then(
              val !== password && '1 should be equal with password'
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
