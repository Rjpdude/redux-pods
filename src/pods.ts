import { Store } from 'redux'
import { State, ActionTypes, ActionCreator } from './exports'
import { resolveStatePaths } from './util'

export class Pods {
  private store: Store
  private states = new Set<State>()
  private updatedStates = new Set<State>()
  private stateTrackers = new Map<State[], () => void>()

  register(store: Store) {
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

    for (const [trackedStates, fn] of this.stateTrackers) {
      const updated = trackedStates.some((s) => this.updatedStates.has(s))

      if (updated) {
        fn()
      }
    }

    this.updatedStates.clear()
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

  createStateTracker(states: State[], fn: () => void) {
    this.stateTrackers.set(states, fn)

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
    this.store.dispatch({
      type: ActionTypes.ResolveNext
    })
  }
}
