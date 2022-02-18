import { Store } from 'redux'
import { State } from './state'
import { ActionTypes, ActionCreator, StateTrackerFn } from './types'

export class Pods {
  private store: Store
  private states = new Set<State<any>>()

  register(store: Store) {
    this.store = store
    this.setStatePaths(store.getState())
  }

  setStatePaths(storeState: any) {
    for (let state of this.states) {
      state.setPath(storeState)
    }

    this.store.dispatch({
      type: ActionTypes.ResolvePrimitives
    })
  }

  registerState(state: State<any>) {
    if (this.states.has(state)) {
      throw new Error('State has already been registered.')
    }
    this.states.add(state)
  }

  createActionHandler<S>(action: ActionCreator<S>, state: State<S>) {
    return (...args: any[]) => {
      this.resolve(action, state, ActionTypes.ActionHandler, ...args)
    }
  }

  createStateTracker<T, S>(fn: StateTrackerFn<T, S>, state: State<S>, trackedState: State<T>) {
    trackedState.watch((...states) => {
      this.resolve(fn, state, ActionTypes.StateTracker, ...states)
    })
  }

  resolve<T extends (...args: any[]) => any>(fn: T, state: State<any>, type: ActionTypes, ...args: Parameters<T> | [() => Parameters<T>]) {
    this.triggerAction(state, {
      type,
      stateId: state.id,
      resolver: () => {
        return fn(...(typeof args[0] === 'function' ? args[0]() : args))
      }
    })
  }

  triggerAction(state: State<any>, action: any) {
    this.store.dispatch(action)
    state.sideEffects()
  }
}
