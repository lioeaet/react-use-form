import { useForm, advanced, array } from './useForm'
import { FormInput } from './FormInput'
import { SubformsArray } from './SubformsArray'

function App() {
  const { Form, actions } = useForm({
    initValues: [
      {
        password: '',
        passwordRepeat: {
          deep: '',
        },
      },
    ],
    validators: array({
      password: [
        delay((val) => !val && 'should not be empty'),
        delay((val) => val === '1' && 'should not be 1'),
        delay((val) => val === '12' && 'should not be 12', 1000),
        delay((val) => val === '123' && 'should not be 123'),
      ],
      passwordRepeat: {
        deep: advanced({
          CHANGE: [
            delay((val, password) => {
              return val !== password && 'should be equal with password'
            }),
            (value) => {
              return !value && 'should not be empty'
            },
          ],
          BLUR: [
            (value, password) => {
              return new Promise((r) => r()).then(
                () => value === password && 'should not be equal with password'
              )
            },
          ],
          PARENTS: ['i.password'],
        }),
      },
    }),
    submit: console.log,
  })

  return (
    <Form onSubmit={actions.submit}>
      <FormInput name="password" />
      <FormInput name="passwordRepeat.deep" />
      <SubformsArray name="array" />
      <button type="submit">submit</button>
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
