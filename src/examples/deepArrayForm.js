import { useForm, advanced, array, useField, useSubformsArray } from './useForm'

function App() {
  const { Form, actions } = useForm({
    initValues: {
      deep: [
        {
          array: [
            {
              inside: '',
              deeply: '',
            },
          ],
          name: '',
        },
      ],
    },
    validators: {
      deep: array({
        array: array({
          inside: (val) => !val && 'required',
          deeply: advanced({
            CHANGE: [
              (val) => !val && 'required',
              (val, inside) => val !== inside && 'should be equal',
            ],
            PARENTS: ['deep.i.array.i.inside'],
          }),
        }),
      }),
    },
    submit: console.log,
  })

  return (
    <Form onSubmit={actions.submit}>
      <FirstSubformsForm name="deep" />
      <button type="submit">submit</button>
    </Form>
  )
}

export default App

function FormInput({ name, placeholder }) {
  const { value, error, loading, onChange, onBlur } = useField(name)
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        {loading && 'loading...'}
      </div>
      <div>{error}</div>
    </div>
  )
}

function FirstSubformsForm({ name }) {
  const { value, insert, replace, remove } = useSubformsArray(name)

  return (
    <>
      {value.map((obj, i) => (
        <div key={i}>
          <SecondSubformsForm name={`${name}.${i}.array`} />
          <FormInput name={`${name}.${i}.name`} />
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

function SecondSubformsForm({ name }) {
  const { value, insert, replace, remove } = useSubformsArray(name)

  return value.map((obj, i) => (
    <div>
      <FormInput
        name={`${name}.${i}.inside`}
        placeholder={`${name}.${i}.inside`}
      />
      <FormInput
        name={`${name}.${i}.deeply`}
        placeholder={`${name}.${i}.deeply`}
      />
    </div>
  ))
}
