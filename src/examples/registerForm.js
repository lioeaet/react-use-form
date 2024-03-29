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
          (val, password) =>
            new Promise((r) => r()).then(
              () => val !== password && 'should be equal with password'
            ),
          (value) => {
            return !value && 'should be filled'
            // new Promise((r) => r()).then(
            //   () =>
            // )
          },
        ],
        VALIDATE: [
          (value, password) =>
            new Promise((r) => r()).then(
              () =>
                Boolean(value === password) &&
                'should not be equal with password'
            ),
        ],
        PARENTS: ['password'],
      }),
      // arrayField: array({
      //   inArr: (val) => 'oki'
      // })
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
