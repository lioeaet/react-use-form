import { useForm, advanced /* , array */ } from './useForm'
import { Input } from './Input'

function App() {
  const { Form } = useForm({
    initValues: {
      password: '',
      passwordRepeat: '',
      array: [
        {
          name: 'oki',
          surname: 'doki',
        },
      ],
    },
    validators: {
      password: [
        delay((val) => !val && 'should not be empty'),
        delay((val) => val === '1' && 'should not be 1'),
        delay((val) => val === '12' && 'should not be 12', 1000),
        delay((val) => val === '123' && 'should not be 123'),
      ],
      // passwordRepeat: advanced({
      //   DEFAULT: [
      //     delay((val, password) => {
      //       return val !== password && 'should be equal with password'
      //     }),
      //     (value, password) => {
      //       return new Promise((r) => r()).then(
      //         () => value === password && 'should not be equal with password'
      //       )
      //     },
      //   ],
      //   VALIDATE: [
      //     (value) => {
      //       return !value && 'should not be empty'
      //       // new Promise((r) => r()).then(
      //       //   () =>
      //       // )
      //     },
      //   ],
      //   PARENTS: ['password'],
      // }),
      // array: array({
      //   name: (val) => !val && 'should not be empty',
      //   surname: {
      //     DEFAULT: (val, i, name) =>
      //       val === name && 'should not be equal with name',
      //     parents: ['array.i.name'],
      //   },
      // }),
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

function delay(fn, ms = 200) {
  return (...args) =>
    new Promise((r) => {
      setTimeout(() => {
        r()
      }, ms)
    }).then(() => fn(...args))
}
