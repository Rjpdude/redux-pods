import { Store } from 'redux'
import {
  podsInstance,
  StateTree,
  State,
  BranchMapObject,
  PodState
} from './exports'
import { generateStateProxy } from './proxy'
import { reactError } from './util'
import { ObserverType } from './types'
import get from 'lodash.get'

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
  toTrack: PodState<T> | State<T> | T,
  observerFn: (cur: T, prev: T) => void
) {
  let trackerObj =
    toTrack instanceof State ? toTrack : getPodStateInstance(toTrack)

  if (!(trackerObj instanceof State)) {
    trackerObj = podsInstance.useLastStateReference()
    podsInstance.clearReferenceMap()
  }

  return podsInstance.setObserver(
    [trackerObj],
    ObserverType.Consecutive,
    ([val]) => {
      observerFn(val.cur, val.prev)
    }
  )
}

export function track<T>(
  toTrack: PodState<T> | T,
  trackerFn: (cur: T, prev: T) => void
) {
  let trackerObj = getPodStateInstance(toTrack)

  if (!(trackerObj instanceof State)) {
    trackerObj = podsInstance.useLastStateReference()
    podsInstance.clearReferenceMap()
  }

  return podsInstance.setObserver(
    [trackerObj],
    ObserverType.Concurrent,
    ([val]) => {
      trackerFn(val.cur, val.prev)
    }
  )
}

export function apply(updateFn: () => void) {
  podsInstance.resolveConcurrentFn(updateFn)
}

export function getPodStateInstance(podState: PodState) {
  if (podState !== undefined) {
    const getInstance = (podState as any).getInstance

    if (typeof getInstance !== 'function') {
      // throw new Error(
      //   'Error attempting to get instance function on pod state object.'
      // )
      return podState
    }

    return getInstance()
  }
}

export function state<T>(
  obj: T
): PodState<
  {
    [K in keyof T]: T[K] extends (
      ...args: any[]
    ) => Generator<any, infer R, any>
      ? R
      : T[K]
  }
> {
  return generateStateProxy(obj) as any
}

export function use<T>(stateOrProp: PodState<T> | T): T
export function use<A extends any[]>(
  ...statesAndProps: A
): {
  [Index in keyof A]: A[Index] extends PodState<infer T> ? T : A[Index]
}
export function use(...args: any[]) {
  const react = getReact()

  const references = args.map((ref) => {
    const state = getPodStateInstance(ref)
    return state instanceof State
      ? state
      : podsInstance.shiftLastStateReference()
  })

  const [state, setState] = react.useState(() => {
    const res = references.map((ref) => {
      if (ref !== undefined) {
        if (ref instanceof State) {
          return ref.getState()
        }

        if (ref.state && ref.propertyPath) {
          return get(ref.state.getState(), ref.propertyPath)
        }
      }
      return undefined
    })

    return res.length === 1 ? res[0] : res
  })

  react.useEffect(() => {
    return podsInstance.setObserver(
      references as any,
      ObserverType.Consecutive,
      (vals: any[]) => {
        const mappedVals = vals.map(({ cur }) => cur)
        setState(mappedVals.length === 1 ? mappedVals[0] : mappedVals)
      }
    )
  }, [])

  return state
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
