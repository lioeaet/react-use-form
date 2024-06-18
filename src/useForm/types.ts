import { SyntheticEvent } from 'react'

export type State = {
  values: Object
  submitting: boolean
  submitted: boolean
  failedError: boolean
  validationEnabled: Record<string, boolean>
  errors: Record<string, unknown>
  loaders: Record<string, boolean>
}

export type InitValues = {
  [key: string]: InitValues | InitValues[] | string | number | boolean | null
}

export type ValidateType = 'change' | 'blur' | 'submit'

export type Actions = {
  setLoader: (name: string, val: boolean) => void
  setError: (name: string, error: unknown) => void
  change: (name: string, value: unknown) => void
  blur: (name: string) => void
  submit: (e: SyntheticEvent) => Promise<unknown>
  reset: (initValues: Object) => void
  insert: (name: string, i: number, value: unknown) => void
  replace: (name: string, from: number, to: number) => void
  remove: (name: string, i: number) => void
}

export type ReplacementDuringValidation = {
  name: string
  type: 'array remove' | 'array replace' | 'array insert'
  args: { i: number } | { from: number; to: number }
}

export type ValidatorFn<T, Args extends unknown[] = unknown[]> = (
  val: T,
  ...args: Args
) => unknown

export type AdvancedValidator<T> = {
  CHANGE?: ValidatorFn<T> | ValidatorFn<T>[]
  BLUR?: ValidatorFn<T> | ValidatorFn<T>[]
  SUBMIT?: ValidatorFn<T> | ValidatorFn<T>[]
  PARENTS?: string[]
}

export type Validator<T> =
  | ValidatorFn<T>
  | ValidatorFn<T>[]
  | AdvancedValidator<T>

export type ValidatorsMap = {
  [key: string | symbol]: ValidatorsMap | ValidatorsMap[] | Validator<unknown>
}

export type ValidateObjItem = {
  validators: ValidatorFn<unknown>[]
  argsFields: string[]
}

export type ValidateObj = Record<string, ValidateObjItem>

export type ChildFields = Record<string, string[]>

export type StateRef = { current: State }
