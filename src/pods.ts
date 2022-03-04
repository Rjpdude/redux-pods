import { Store } from 'redux'
import { resolveStatePaths } from './util'
import {
  StateTree,
  State,
  ActionTypes,
  Observer,
  ObserverType,
  ResolutionStatus,
  StateReference
} from './exports'
import get from 'lodash.get'

export class Pods {
  private stateTree: StateTree
  private store: Store

  private referenceMap: StateReference[] = []
  private resolutionStatus = ResolutionStatus.Pendng

  private states = new Set<State>()
  private updatedStates = new Map<State, boolean>()
  private observers = new Map<Array<State | StateReference>, Observer>()

  registerReduxStore(store: Store) {
    this.store = store
    this.setStatePaths(store.getState())

    store.subscribe(() => {
      this.onStateRes()
    })
  }

  registerStateTree(stateTree: StateTree) {
    if (this.store) {
      throw new Error(
        'A redux store has already been established and cannot be used independently.'
      )
    }
    this.stateTree = stateTree
    this.stateTree.resolveCurrentState({
      type: ActionTypes.ResolveStateTree
    })
  }

  registerState(state: State<any>) {
    if (this.states.has(state)) {
      throw new Error('State has already been registered.')
    }
    this.states.add(state)
  }

  setUpdatedState(state: State<any>) {
    this.updatedStates.set(state, false)
  }

  private onStateRes(applyDraft = false) {
    if (this.updatedStates.size === 0) {
      return
    }

    if (applyDraft) {
      for (const state of this.states) {
        state.applyNextState()
      }
    }

    this.resolveConsecutiveObservers()
    this.updatedStates.clear()
  }

  setObserver(
    val: Array<State | StateReference>,
    type: ObserverType,
    observerFn: (...args: any[]) => void
  ) {
    this.observers.set(val, {
      type,
      fn: observerFn
    })

    return () => {
      this.observers.delete(val)
    }
  }

  sideEffects() {
    for (let [state, flag] of this.updatedStates) {
      if (!flag) {
        this.updatedStates.set(state, true)
        this.resolveConcurrentObservers(state)
        this.sideEffects()
        return
      }
    }
    this.next()
  }

  resolveObservers(
    type: ObserverType,
    resolve: (
      tracked: Array<State | StateReference>,
      fn: Observer['fn']
    ) => void
  ) {
    const status =
      type === ObserverType.Concurrent
        ? ResolutionStatus.ConcurrentAction
        : ResolutionStatus.ConsecutiveAction

    this.useResolutionStatus(status, () => {
      for (const [tracked, observer] of this.observers) {
        if (observer.type === type) {
          resolve(tracked, observer.fn)
        }
      }
    })
  }

  resolveConsecutiveObservers() {
    this.resolveObservers(ObserverType.Consecutive, (tracked, fn) => {
      const hasStateUpdate = tracked.some((t) =>
        this.updatedStates.has(t instanceof State ? t : t.state)
      )

      if (hasStateUpdate) {
        const next = tracked.map((t) => ({
          cur:
            t instanceof State
              ? t.getState()
              : get(t.state.getState(), t.propertyPath),
          prev:
            t instanceof State
              ? t.getPreviousState()
              : get(t.state.getPreviousState(), t.propertyPath)
        }))

        const updated = next.some(({ cur, prev }) => !Object.is(cur, prev))

        if (updated) {
          fn(next)
        }
      }
    })
  }

  resolveConcurrentObservers(trackedState: State) {
    this.resolveObservers(ObserverType.Concurrent, (tracked, fn) => {
      const hasStateUpdate = tracked.some(
        (t) => (t instanceof State ? t : t.state) === trackedState
      )

      if (hasStateUpdate) {
        const next = tracked.map((t) => ({
          cur:
            t instanceof State
              ? t.getProxiedState()
              : get(t.state.getProxiedState(), t.propertyPath),
          prev:
            t instanceof State
              ? t.getState()
              : get(t.state.getState(), t.propertyPath)
        }))

        const updated = next.some(({ cur, prev }) => !Object.is(cur, prev))

        if (updated) {
          fn(next)
        }
      }
    })
  }

  resolveConcurrentFn(fn: () => void) {
    if (this.resolvingWithin(ResolutionStatus.ConsecutiveAction)) {
      throw new Error(
        'Apply handlers cannot be called within the callstack of observer-like functions.'
      )
    }

    this.useResolutionStatus(ResolutionStatus.ConcurrentAction, () => {
      fn()
      this.sideEffects()
    })
  }

  generateActionHandler(fn: (...args: any[]) => any) {
    return (...args: any[]) => {
      if (this.resolvingWithin(ResolutionStatus.ConsecutiveAction)) {
        throw new Error(
          'Action handlers cannot be called within the callstack of observer-like functions.'
        )
      }

      return this.useResolutionStatus(ResolutionStatus.ActionHandler, () => {
        const res = fn(...args)

        this.sideEffects()

        return res instanceof Promise
          ? Promise.resolve<void | (() => void)>(res).then((asyncRes) => {
              if (typeof asyncRes === 'function') {
                this.resolveConcurrentFn(asyncRes)
                return
              }
              return asyncRes
            })
          : res
      })
    }
  }

  next() {
    if (this.store) {
      this.store.dispatch({
        type: ActionTypes.ResolveNext
      })
    } else {
      if (this.stateTree) {
        this.stateTree.resolveCurrentState({
          type: ActionTypes.ResolveNext
        })
      }
      this.onStateRes(!this.stateTree)
    }
  }

  setStatePaths(storeState: any) {
    resolveStatePaths(storeState, new Set(this.states))

    this.store.dispatch({
      type: ActionTypes.ResolvePrimitives
    })
  }

  useResolutionStatus<R>(resolutionStatus: ResolutionStatus, fn: () => R): R {
    const previousStatus = this.resolutionStatus

    this.resolutionStatus = resolutionStatus

    let res
    try {
      res = fn()
    } finally {
      this.resolutionStatus = previousStatus
    }
    return res
  }

  resolvingWithin(...status: ResolutionStatus[]) {
    return status.includes(this.resolutionStatus)
  }

  registerStateReference(reference: StateReference) {
    this.referenceMap.push(reference)
  }

  useStateReferencePaths() {
    const paths = this.referenceMap.map(({ propertyPath }) => propertyPath)

    this.clearReferenceMap()

    return paths
  }

  useLastStateReference() {
    return this.referenceMap.pop()
  }

  shiftLastStateReference() {
    return this.referenceMap.shift()
  }

  getLastStateReferences() {
    return this.referenceMap
  }

  clearReferenceMap() {
    this.referenceMap = []
  }

  getState() {
    return this.stateTree
  }

  /** for testing only */

  reset() {
    this.store = undefined as any
    this.stateTree = undefined as any
    this.resolutionStatus = ResolutionStatus.Pendng
    this.states.clear()
    this.updatedStates.clear()
    this.observers.clear()
  }
}
