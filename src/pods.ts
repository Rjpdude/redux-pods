import { Store } from 'redux'
import { resolveStatePaths } from './util'
import {
  StateTree,
  State,
  ActionTypes,
  Observer,
  ObserverType,
  ResolutionStatus
} from './exports'

export class Pods {
  private stateTree: StateTree
  private store: Store
  private resolutionStatus = ResolutionStatus.Pendng

  private states = new Set<State>()
  private updatedStates = new Set<State>()
  private observers = new Map<State[], Observer>()

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
    if (!this.updatedStates.has(state)) {
      this.updatedStates.add(state)
    }
  }

  private onStateRes() {
    if (this.updatedStates.size === 0) {
      return
    }

    for (const state of this.updatedStates) {
      state.applyInternalState()
    }

    this.resolveConsecutiveObservers()
    this.updatedStates.clear()
  }

  setObserver(
    states: State | State[],
    type: ObserverType,
    observerFn: () => void
  ) {
    const arr = Array.isArray(states) ? [...states] : [states]

    this.observers.set(arr, {
      type,
      fn: observerFn
    })

    return () => {
      this.observers.delete(arr)
    }
  }

  sideEffects() {
    const actuallyUpdatedStates = new Set<State>()

    for (let state of this.updatedStates) {
      const updated = state.checkDraftUpdate()

      if (!updated) {
        this.updatedStates.delete(state)
      } else {
        if (!actuallyUpdatedStates.has(state)) {
          actuallyUpdatedStates.add(state)
        }
        this.resolveConcurrentObservers(state)
      }
    }

    if (actuallyUpdatedStates.size) {
      this.updatedStates = actuallyUpdatedStates
      this.next()
    }
  }

  resolveObservers(
    type: ObserverType,
    resolve: (trackedStates: State[], fn: Observer['fn']) => void
  ) {
    const status =
      type === ObserverType.Concurrent
        ? ResolutionStatus.ConcurrentAction
        : ResolutionStatus.ConsecutiveAction

    this.useResolutionStatus(status, () => {
      for (const [trackedStates, observer] of this.observers) {
        if (observer.type === type) {
          resolve(trackedStates, observer.fn)
        }
      }
    })
  }

  resolveConsecutiveObservers() {
    this.resolveObservers(ObserverType.Consecutive, (trackedStates, fn) => {
      const updated = trackedStates.some((s) => this.updatedStates.has(s))

      if (updated) {
        fn()
      }
    })
  }

  resolveConcurrentObservers(state: State) {
    this.resolveObservers(ObserverType.Concurrent, (trackedStates, fn) => {
      if (trackedStates.includes(state)) {
        fn()
      }
    })
  }

  resolveConcurrentFn(fn: () => void) {
    if (this.resolvingWithin(ResolutionStatus.ConcurrentAction)) {
      throw new Error('Apply handlers cannot be called within the callstack of observer-like functions.')
    }

    this.useResolutionStatus(ResolutionStatus.ConcurrentAction, () => {
      fn()
      this.sideEffects()
    })
  }

  generateActionHandler(fn: (...args: any[]) => void) {
    return (...args: any[]) => {
      if (this.resolvingWithin(ResolutionStatus.ConcurrentAction)) {
        throw new Error('Action handlers cannot be called within the callstack of observer-like functions.')
      }

      return this.useResolutionStatus(ResolutionStatus.ActionHandler, () => {
        const res = fn(...args)
        this.sideEffects()
        return res
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
      this.onStateRes()
    }
  }

  setStatePaths(storeState: any) {
    resolveStatePaths(storeState, new Set(this.states))

    this.store.dispatch({
      type: ActionTypes.ResolvePrimitives
    })
  }

  useResolutionStatus(resolutionStatus: ResolutionStatus, fn: () => void) {
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
