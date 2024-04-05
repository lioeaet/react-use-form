import { Fragment } from 'react'
import { FormInput } from './FormInput'
import { useSubformsArray } from './useForm'

export function SubformsArray({ name }) {
  const { value, insert, replace, remove } = useSubformsArray(name)

  return (
    <>
      {value.map((obj, i) => (
        <Fragment key={i}>
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
        </Fragment>
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
