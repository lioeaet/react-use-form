export function getParentFields(validators) {
  const parentFields = {}

  if (!validators || typeof validators === 'function') return parentFields

  for (let fieldName of validators) {
    if (fieldName)
  }
}


export function iterateDeep(value, cb, path = []) {
  if (Array.isArray(value)) value.forEach((item, i) => {
    const nextPath = [...path, i]
    cb(nextPath, item)
    iterateDeep(value, cb, nextPath)
  })
  else if (isPlainObj(value)) {
    for (let key in value) {
      const nextPath = [...path, key]
      cb(nextPath, value[key])
      iterateDeep(value, cb, nextPath)
    }
  }
}

function isPlainObj(x) {
  return x?.__proto__ === ({}).__proto__
}
