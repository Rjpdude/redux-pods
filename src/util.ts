export function isPrimitive(val: any) {
  return val === null || ["string", "number", "bigint", "boolean", "symbol", "undefined"].includes(typeof val)
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
