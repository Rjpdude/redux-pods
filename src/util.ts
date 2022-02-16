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