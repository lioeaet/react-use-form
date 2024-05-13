import { useForm, useField, useSubformsArray, advanced, array } from './useForm'

function App() {
  const { Form, actions } = useForm({
    initValues: {
      array: [
        [
          {
            name: 'doki',
            surname: 'doki',
          },
        ],
      ],
    },
    validators: {
      array: array(
        array({
          name: delay((val) => !val && 'should not be empty', 1000),
          surname: advanced({
            CHANGE: (val, name) =>
              val === name && 'should not be equal with name',
            PARENTS: ['array.i.i.name'],
          }),
        })
      ),
    },
    submit: console.log,
  })

  return (
    <Form onSubmit={actions.submit}>
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

function SubformsArray({ name }) {
  const { value, insert, remove } = useSubformsArray(name)

  return (
    <>
      {value.map((obj, i) => (
        <div key={i}>
          <SecondSubformsArray name={`${name}.${i}`} />
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
            insert(value.length, [{ name: '', surname: '' }])
          }}
        >
          add
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            insert(0, [{ name: '', surname: '' }])
          }}
        >
          unshift
        </button>
      </div>
    </>
  )
}

function SecondSubformsArray({ name }) {
  const { value, insert, replace, remove } = useSubformsArray(name)

  return (
    <>
      {value.map((obj, i) => (
        <div key={i}>
          <FormInput name={`${name}.${i}.name`} />
          <FormInput name={`${name}.${i}.surname`} />
          <button
            onClick={(e) => {
              e.preventDefault()
              remove(i)
            }}
          >
            remove inner
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
          add inner
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
