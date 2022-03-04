import DeepProxy from 'proxy-deep'
import get from 'lodash.get'
import { podsInstance, State } from './exports'
import { ResolutionStatus } from './types'

export function generateStateProxy(stateObj: any) {
  const t = {}
  const proxy = new DeepProxy(t, {
    get(target, key) {
      if (target === t && actionHandlers[key]) {
        return actionHandlers[key]
      } else if (typeof (instance as any)[key] === 'function') {
        return (...args: any[]) => {
          return (instance as any)[key](...args)
        }
      }

      const path = this.path.concat(key as any).join('.')
      const val = get(instance.getProxiedState(), path)

      if (shouldNest(val)) {
        return this.nest({})
      }

      if (
        podsInstance.resolvingWithin(
          ResolutionStatus.ActionHandler,
          ResolutionStatus.ConcurrentAction
        )
      ) {
        if (val instanceof Map || val instanceof Set) {
          return proxyMapOrSet(val, instance, path)
        }
        if (Array.isArray(val)) {
          return proxyArray(val, instance, path)
        }
      }

      if (
        podsInstance.resolvingWithin(
          ResolutionStatus.Pendng,
          ResolutionStatus.Compute
        )
      ) {
        podsInstance.registerStateReference({
          state: instance,
          propertyPath: path
        })
      }

      return val
    },
    set(target, key, value) {
      if (
        !podsInstance.resolvingWithin(
          ResolutionStatus.ActionHandler,
          ResolutionStatus.ConcurrentAction
        )
      ) {
        throw new Error(
          'State updates cannot be applied outside action handler functions.'
        )
      }

      const target2 =
        this.path.length === 0
          ? instance.getProxiedState()
          : get(instance.getProxiedState(), this.path.join('.'))

      target2[key] = value

      instance.onPropertyUpdate(
        target2[key],
        this.path.concat(key as any).join('.')
      )
      return true
    }
  })

  const properties: any = {}
  const actionHandlers: any = {}
  const getters: any = {}

  for (const [key, val] of Object.entries(stateObj)) {
    if (isComputeFn(val)) {
      getters[key] = val
    } else if (typeof val === 'function') {
      actionHandlers[key] = podsInstance.generateActionHandler((...args) => {
        return (val as Function).call(proxy, ...args)
      })
    } else {
      properties[key] = val
    }
  }

  const instance = new State(properties)

  podsInstance.resolveConcurrentFn(() => {
    for (const [key, getter] of Object.entries(getters)) {
      // @ts-ignore
      proxy[key] = podsInstance.useResolutionStatus(
        ResolutionStatus.Compute,
        () => {
          const firstAccessorPaths: string[] = []
          const nextAccessorPaths: string[] = []

          const compute = (instanceOrPath: any) => {
            const instantiation = instanceOrPath === podsInstance

            if (instantiation) {
              podsInstance.clearReferenceMap()
            }

            const generator = (getter as GeneratorFunction).call(proxy)
            const { value, done } = generator.next()

            if (instantiation) {
              firstAccessorPaths.push(...podsInstance.useStateReferencePaths())
            }

            if (!done) {
              let continueComputation = false

              if (instantiation) {
                if (firstAccessorPaths.length === 0) {
                  throw new Error(
                    'Yield within state computes must reference atleast one property to narrow computation. Ex: `yeild this.prop`'
                  )
                }
                continueComputation = true
              } else {
                continueComputation = firstAccessorPaths.includes(
                  instanceOrPath
                )
              }

              if (!continueComputation) {
                return undefined
              }

              const next = generator.next()

              if (!next.done) {
                throw new Error(
                  'Computes can only yield once to narrowed properties.'
                )
              }

              if (instantiation) {
                nextAccessorPaths.push(...podsInstance.useStateReferencePaths())

                if (nextAccessorPaths.length === 0) {
                  throw new Error(
                    'Computes cannot return undefined or static values on instantiation.'
                  )
                }
              }

              return next.value
            }

            if (instantiation && firstAccessorPaths.length === 0) {
              throw new Error(
                'Computes cannot return undefined or static values on instantiation.'
              )
            }

            return value
          }

          const res = compute(podsInstance)
          const resPaths =
            nextAccessorPaths.length === 0
              ? firstAccessorPaths
              : nextAccessorPaths

          instance.registerComputePaths(resPaths, (val) => {
            const computed = compute(val)

            if (computed !== undefined) {
              // @ts-ignore
              proxy[key] = computed
            }
          })

          return res
        }
      )
    }
  })

  return proxy
}

const arrayModifiers = [
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift'
]

export function proxyArray(val: any, instance: State, path: string) {
  return new Proxy(val, {
    get(_target, key) {
      if (arrayModifiers.includes(key as string)) {
        return (...args: any[]) => {
          const response = val[key](...args)
          instance.onPropertyUpdate(val, path)
          return response
        }
      }

      return val[key]
    }
  })
}

export function proxyMapOrSet(val: any, instance: State, path: string) {
  const setKey = val instanceof Map ? 'set' : 'add'

  return new Proxy(val, {
    get(_target, key) {
      if (key === setKey || key === 'clear' || key === 'delete') {
        return (...args: any[]) => {
          const response = val[key](...args)
          instance.onPropertyUpdate(val, path)
          return response
        }
      }

      return val[key]
    }
  })
}

export function shouldNest(val: any) {
  return (
    typeof val === 'object' &&
    val !== null &&
    !(val instanceof Set) &&
    !(val instanceof Map) &&
    !Array.isArray(val)
  )
}

export function isComputeFn(fn: any) {
  return fn instanceof Object.getPrototypeOf(function*() {}).constructor
}
