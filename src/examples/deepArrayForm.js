import {
  useForm,
  advanced,
  array,
  useField,
  useSubformsArray,
} from '../useForm'
import { Link } from 'react-router-dom'

export function DeepArrayForm() {
  const { Form, actions } = useForm({
    initValues: {
      deep: [
        {
          name: '',
          very: {
            array: [
              {
                inside: {
                  deeply: '',
                },
                shallow: '',
              },
            ],
          },
        },
      ],
    },
    validators: {
      deep: array({
        name: delay((val) => !val && 'required', 1000),
        very: {
          array: array({
            inside: {
              deeply: delay((val) => !val && 'required', 1000),
            },
            shallow: advanced({
              CHANGE: [
                (val) => !val && 'required',
                (val, inside) => val !== inside && 'should be equal',
              ],
              PARENTS: ['deep.i.very.array.i.inside.deeply'],
            }),
          }),
        },
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
        <FirstSubformsForm name="deep" />
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
          style={{ width: 200 }}
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
          <FormInput
            placeholder={`${name}.${i}.name`}
            name={`${name}.${i}.name`}
          />
          <button
            onClick={(e) => {
              e.preventDefault()
              remove(i)
            }}
          >
            remove {`${name}.${i}`}
          </button>
          <SecondSubformsForm name={`${name}.${i}.very.array`} />
        </div>
      ))}
      <div>
        <button
          onClick={(e) => {
            e.preventDefault()
            insert(value.length, {
              name: '',
              very: {
                array: [
                  {
                    inside: {
                      deeply: '',
                    },
                    shallow: '',
                  },
                ],
              },
            })
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
            insert(0, {
              name: '',
              very: {
                array: [
                  {
                    inside: {
                      deeply: '',
                    },
                    shallow: '',
                  },
                ],
              },
            })
          }}
        >
          unshift
        </button>
      </div>
    </>
  )
}

function SecondSubformsForm({ name }) {
  const { value, insert, remove } = useSubformsArray(name)

  return value.map((obj, i) => (
    <div key={i}>
      <FormInput
        name={`${name}.${i}.inside.deeply`}
        placeholder={`${name}.${i}.inside.deeply`}
      />
      <FormInput
        name={`${name}.${i}.shallow`}
        placeholder={`${name}.${i}.shallow`}
      />
      <button
        onClick={(e) => {
          e.preventDefault()
          insert(0, {
            inside: {
              deeply: '',
            },
            shallow: '',
          })
        }}
      >
        unshift second
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          remove(i)
        }}
      >
        remove {`${name}.${i}`}
      </button>
    </div>
  ))
}
