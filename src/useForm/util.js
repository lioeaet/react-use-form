export function iterateDeep(value, cb, path = []) {
  cb(path, value)

  if (Array.isArray(value))
    value.forEach((item, i) => {
      iterateDeep(value[i], cb, [...path, i])
    })
  else if (isPlainObj(value)) {
    for (let key in value) iterateDeep(value[key], cb, [...path, key])
  }
}

function isPlainObj(x) {
  return x?.__proto__ === {}.__proto__
}

export function clone(x) {
  if (isPlainObj(x)) {
    const newInst = {}
    for (let key in x) newInst[key] = x[key]
    return newInst
  } else if (Array.isArray(x)) return x.map(clone)
  else return x
}

// name.split не так проста из-за i в массивах
export function getFieldFromInst(name, inst) {
  return name
    .split('.')
    .reduce((current, pathName) => current?.[pathName], inst)
}

export function setFieldToInst(name, value, inst) {
  const path = name.split('.')
  let current = inst
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i + 1 === path.length) current[key] = value
    else current = current[key]
  }
  return inst
}
