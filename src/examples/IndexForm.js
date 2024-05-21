import {
  useForm,
  useField,
  useSubformsArray,
  advanced,
  array,
} from '../useForm'
import { Link } from 'react-router-dom'

export function IndexForm() {
  const { Form, actions } = useForm({
    initValues: {
      password: '',
      passwordRepeat: {
        deep: '',
      },
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
          PARENTS: ['password'],
        }),
      },
      array: array({
        name: delay((val) => !val && 'should not be empty', 1000),
        surname: advanced({
          CHANGE: (val, name) =>
            val === name && 'should not be equal with name',
          PARENTS: ['array.i.name'],
        }),
      }),
    },
    submit: console.log,
  })

  return (
    <>
      <div style={{ display: 'grid', gap: 8 }}>
        <Link to="/">index</Link>
        <Link to="/array-in-array">array in array</Link>
        <Link to="/deep-array">deep array</Link>
      </div>
      <Form onSubmit={actions.submit}>
        <FormInput name="password" />
        <FormInput name="passwordRepeat.deep" />
        <SubformsArray name="array" />
        <button type="submit">submit</button>
      </Form>
    </>
  )
}

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
