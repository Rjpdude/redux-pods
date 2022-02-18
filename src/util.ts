import { State } from './exports'

export function isPrimitive(val: any) {
  return [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'undefined'
  ].includes(typeof val)
}

export function wrap<T>(val: T): T {
  return Object(val)
}

export function unwrap<T>(val: T): T {
  return (val instanceof Object ? (val as Object).valueOf() : val) as T
}

export function resolveStatePaths(
  obj: any,
  states: Set<State<any>>,
  ...path: string[]
) {
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val !== 'object') {
      continue
    }

    const curPath = path.concat(key)

    for (const state of states) {
      if (state.current === val) {
        state.setPath(curPath.join('.'))
        states.delete(state)

        if (states.size === 0) {
          return
        }
        break
      }
    }

    resolveStatePaths(val, states, ...curPath)
  }
}

export function reactError() {
  throw new Error('The usePod function requires React 16.8.0 or higher.')
}
