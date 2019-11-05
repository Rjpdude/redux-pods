import { PodReducer } from '../reducer/reducer'
import { ProxiedAction } from '../actions/proxied_action'

import {
  ChainedPod,
  ActionSet,
  Effect,
  ExposedActionCreator
} from '../internal/interfaces'

export function mergeEffects<E extends Effect<any, any>>(
  existingEffect: E,
  newEffect: E
): E {
  if (typeof newEffect !== 'function') {
    throw new Error(
      `Invalid reducer of type ${typeof newEffect}; function expected.`
    )
  }
  return !existingEffect
    ? newEffect
    : (((state, action) => {
        const res = existingEffect(state, action)
        return newEffect(res === undefined ? state : res, action)
      }) as E)
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

export function isPod<S, A extends ActionSet<S>>(
  pod: ChainedPod<any, any>
): pod is ChainedPod<S, A> {
  return (
    typeof pod === 'function' &&
    typeof pod.instance === 'function' &&
    pod.instance() instanceof PodReducer
  )
}

export function isActionSet<S>(obj: any): obj is ActionSet<S> {
  return (
    typeof obj === 'object' &&
    Object.values(obj).every((val) => {
      return typeof val === 'function'
    })
  )
}

export function isProxiedAction(val: any): val is ExposedActionCreator<any> {
  return (
    typeof val === 'function' &&
    typeof val.instance === 'function' &&
    val.instance() instanceof ProxiedAction
  )
}
