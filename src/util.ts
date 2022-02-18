export function isPrimitive(val: any) {
  return (
    val === null ||
    ['string', 'number', 'bigint', 'boolean', 'undefined'].includes(typeof val)
  )
}

export function wrapPrimitive(val: any) {
  const type = typeof val
  return type === 'string'
    ? new String(val)
    : type === 'number'
    ? new Number(val)
    : type === 'boolean'
    ? new Boolean(val)
    : type === 'bigint' && BigInt(val)
}

export function unrwapPrimitive(val: any) {
  return val instanceof String ||
    val instanceof Number ||
    val instanceof Boolean ||
    val instanceof BigInt ||
    val instanceof Symbol
    ? val.valueOf()
    : val
}

export function checkForPrimitive<T>(val: T): T {
  if (isPrimitive(val)) {
    return (wrapPrimitive(val) as unknown) as T
  }
  return val
}

export function findPath(obj: any, toFind: any, ...path: string[]): string {
  if (toFind === undefined || toFind === null) {
    return ''
  }

  if (Object.is(obj, toFind)) {
    return path.join('.')
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      if (key) {
        const res = findPath(obj[key], toFind, ...path.concat(key))
        if (typeof res === 'string') {
          return res
        }
      }
    }
  }
  return undefined
}

export function reactError() {
  throw new Error('The usePod function requires React 16.8.0 or higher.')
}
