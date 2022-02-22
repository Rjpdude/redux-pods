import { Store } from 'redux'
import { StateTree, State, ActionTypes, ActionCreator, Observer, ObserverType } from './exports'
import { resolveStatePaths } from './util'

export class Pods {
  private store: Store
  private stateTree: StateTree
  private states = new Set<State>()
  private updatedStates = new Set<State>()
  private stateTrackers = new Map<State[], Observer>()

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

  registerReduxStore(store: Store) {
    this.store = store
    this.setStatePaths(store.getState())

    store.subscribe(() => {
      this.onStateRes()
    })
  }

  onStateRes() {
    if (this.updatedStates.size === 0) {
      return
    }

    for (const [trackedStates, observer] of this.stateTrackers) {
      if (observer.type === ObserverType.Consecutive) {
        const updated = trackedStates.some((s) => this.updatedStates.has(s))
  
        if (updated) {
          observer.fn()
        }
      }
    }

    this.updatedStates.clear()
  }

  resolveConcurrentObservers(state: State) {
    for (const [trackedStates, observer] of this.stateTrackers) {
      if (observer.type === ObserverType.Concurrent) {
        if (trackedStates.includes(state)) {
          observer.fn()
        }
      }
    }
  }

  setStatePaths(storeState: any) {
    resolveStatePaths(storeState, new Set(this.states))

    this.store.dispatch({
      type: ActionTypes.ResolvePrimitives
    })
  }

  setUpdatedState(state: State<any>) {
    if (!this.updatedStates.has(state)) {
      this.updatedStates.add(state)
    }
  }

  createStateTracker(states: State[], fn: () => void, type = ObserverType.Consecutive) {
    this.stateTrackers.set(states, {
      type,
      fn
    })

    return () => {
      this.stateTrackers.delete(states)
    }
  }

  registerState(state: State<any>) {
    if (this.states.has(state)) {
      throw new Error('State has already been registered.')
    }
    this.states.add(state)
  }

  createActionHandler<S>(action: ActionCreator<S>, state: State<S>) {
    return (...args: any[]) => {
      if (state.actionsLocked) {
        throw new Error(
          'To prevent race conditions, state actions cannot be called within watcher functions.'
        )
      }

      state.resolveNext(true, () => {
        return action(...args)
      })
    }
  }

  next() {
    if (this.store) {
      this.store.dispatch({
        type: ActionTypes.ResolveNext
      })
    } else if (this.stateTree) {
      this.stateTree.resolveCurrentState({
        type: ActionTypes.ResolveNext
      })
      this.onStateRes()
    }
  }

  getState() {
    return this.stateTree
  }
}
