import { useForm, advanced, array, useField, useSubformsArray } from './useForm'

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
    validators: {
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
    },
    submit: console.log,
  })

  return (
    <Form onSubmit={actions.submit}>
      <SubformsForm />
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

function FormInput({ name }) {
  const { value, error, loading, onChange, onBlur } = useField(name)
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        {loading && 'loading...'}
      </div>
      <div>{error}</div>
    </div>
  )
}

function SubformsForm() {
  const { value, insert, replace, remove } = useSubformsArray('')

  return (
    <>
      {value.map((obj, i) => (
        <div key={i}>
          <FormInput name={`${i}.password`} />
          <FormInput name={`${i}.passwordRepeat.deep`} />
          <button
            onClick={(e) => {
              e.preventDefault()
              remove(i)
            }}
          >
            remove
          </button>
        </div>
      ))}
      <div>
        <button
          onClick={(e) => {
            e.preventDefault()
            insert(value.length, { name: '', surname: '' })
          }}
        >
          add
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            replace(3, 1)
          }}
        >
          replace 3-1
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            replace(1, 3)
          }}
        >
          replace 1-3
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            insert(0, { name: '', surname: '' })
          }}
        >
          unshift
        </button>
      </div>
    </>
  )
}
