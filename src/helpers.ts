import { Store } from 'redux'
import {
  podsInstance,
  StateTree,
  State,
  InferStates,
  BranchMapObject,
  PodState,
  FunctionProperties,
  StateProperties
} from './exports'
import { mapStateValues, reactError } from './util'
import { createDraft, finishDraft } from 'immer'
import { ObserverType } from './types'

export function register(store: Store) {
  podsInstance.registerReduxStore(store)
}

export function tree<T>(tree: T) {
  const stateTree = new StateTree(tree)
  podsInstance.registerStateTree(stateTree)
  return stateTree
}

export function branch<B>(branch: BranchMapObject<B>): B {
  return branch as any
}

export function observe<T>(
  podState: PodState<T> | State<T>,
  observerFn: (previousState: T) => void
) {
  const stateInstance = podState instanceof State ? podState : getPodStateInstance(podState)

  return podsInstance.setObserver(
    stateInstance,
    ObserverType.Consecutive,
    () => {
      observerFn(stateInstance.previous)
    }
  )
}

export function track<T>(
  podState: PodState<T>,
  trackerFn: (previousState: T) => void
) {
  const stateInstance = getPodStateInstance(podState)

  return podsInstance.setObserver(
    stateInstance,
    ObserverType.Concurrent,
    () => {
      trackerFn(stateInstance.getState())
    }
  )
}

export function apply(updateFn: () => void) {
  podsInstance.resolveConcurrentFn(updateFn)
}

export function getPodStateInstance<T>(podState: PodState<T>) {
  const getInstance = (podState as any).getInstance

  if (typeof getInstance !== 'function') {
    throw new Error(
      'Error attempting to get instance function on pod state object.'
    )
  }

  return getInstance() as State<T>
}

export function state<T>(
  initialState: T
): PodState<
  {
    [K in keyof StateProperties<T>]: T[K]
  },
  {
    [K in keyof FunctionProperties<T>]: T[K]
  }
>
export function state<S, A>(initialState: S, actions: A): PodState<S, A>

export function state(arg1: any, arg2: any = {}): any {
  const obj = { ...arg1, ...arg2 }

  const properties: any = {}
  const functions: any = {}

  for (let [key, val] of Object.entries(obj)) {
    if (typeof val === 'function') {
      functions[key] = val
    } else {
      properties[key] = val
    }
  }

  const draftState = finishDraft(createDraft(properties))
  const instance = new State(draftState)

  const stateProxy = new Proxy({} as any, {
    set(_obj, prop, value) {
      const draft = instance.getProxiedState()
      draft[prop] = value
      return true
    },

    get(target, prop, receiver) {
      if (functions[prop]) {
        return podsInstance.generateActionHandler(functions[prop])
      } else if (typeof (instance as any)[prop] === 'function') {
        return (...args: any[]) => {
          return (instance as any)[prop](...args)
        }
      }
      return (instance.getProxiedState() as any)[prop]
    }
  })

  return stateProxy
}

export function usePods<S extends PodState[]>(...states: S): InferStates<S> {
  const react = getReact()

  const [podState, setPodState] = react.useState(() => {
    return mapStateValues(states)
  })

  react.useEffect(() => {
    const stateInstances = states.map(({ getInstance }) => getInstance())

    return podsInstance.setObserver(
      stateInstances,
      ObserverType.Consecutive,
      () => {
        setPodState(mapStateValues(states))
      }
    )
  }, [])

  return podState
}

export function getReact() {
  let react: any

  try {
    react = require('react')
  } catch (error) {
    reactError()
  }

  if (!react.useState || !react.useEffect) {
    reactError()
  }

  return react
}
