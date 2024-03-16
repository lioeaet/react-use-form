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

// name.split не так проста из-за i в массивах
export function getFieldFromInst(name, inst) {
  return name
    .split('.')
    .reduce((current, pathName) => current?.[pathName], inst)
}
