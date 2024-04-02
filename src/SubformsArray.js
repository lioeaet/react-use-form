import { Fragment } from 'react'
import { FormInput } from './FormInput'
import { useSubformsArray } from './useForm'

export function SubformsArray({ name }) {
  const { value, push, unshift, splice, remove } = useSubformsArray(name)

  return (
    <>
      {value.map((obj, i) => (
        <Fragment key={i}>
          <FormInput name={`${name}.${i}.name`} />
          <FormInput name={`${name}.${i}.surname`} />
          <div onClick={() => remove(i)}>remove</div>
        </Fragment>
      ))}
      <div onClick={() => push({ name: '', surname: '' })}>add</div>
    </>
  )
}