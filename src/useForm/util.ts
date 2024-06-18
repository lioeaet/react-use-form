import { ValidatorsMap } from './types'
import { VALIDATOR_INSTANCE } from './validate'

export function iterateDeep(
  value: unknown,
  cb: (path: (string | number | symbol)[], value: unknown) => void,
  path: (string | number | symbol)[] = []
) {
  cb(path, value)

  if (Array.isArray(value))
    value.forEach((item, i) => {
      iterateDeep(value[i], cb, [...path, i])
    })
  else if (isPlainObj(value)) {
    for (let key in value as Record<string, unknown>)
      iterateDeep((value as Record<string | symbol, unknown>)[key], cb, [
        ...path,
        key,
      ])
    Object.getOwnPropertySymbols(value).forEach((sym: symbol) => {
      iterateDeep((value as Record<string | symbol, unknown>)[sym], cb, [
        ...path,
        sym,
      ])
    })
  }
}

export function isPlainObj(x: unknown) {
  return x && Object.getPrototypeOf(x) === Object.getPrototypeOf({})
}

export function clone<T>(x: T): T {
  if (isPlainObj(x)) {
    const newInst = {}
    for (let key in x) (newInst as Record<string, unknown>)[key] = x[key]
    return newInst as T
  } else if (Array.isArray(x)) return x.map(clone) as T
  else return x
}

export function getFieldFromInst(
  name: string,
  inst: Record<string, unknown>
): unknown {
  return name
    .split('.')
    .reduce((current, pathName) => (current as any)?.[pathName], inst)
}

export function getFieldFromValidatorsMap(
  name: string,
  validatorsMap: ValidatorsMap
) {
  return name.split('.').reduce((current: any, pathName: string) => {
    if (current?.[VALIDATOR_INSTANCE]) {
      while (current?.[VALIDATOR_INSTANCE]) {
        current = current?.[VALIDATOR_INSTANCE]
      }
    }
    return current?.[pathName]
  }, validatorsMap)
}

export function setFieldToInst(
  name: string,
  value: unknown,
  inst: Record<string, unknown> | unknown[]
) {
  const path = name.split('.')
  let current = inst
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i + 1 === path.length) (current as any)[key] = value
    else current = (current as any)[key]
  }
  return inst
}
