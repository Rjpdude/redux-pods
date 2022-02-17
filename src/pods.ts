import { Store } from 'redux'
import { State } from './state'
import { ActionTypes, DraftFn, ActionCreator, StateTrackerFn } from './types'

export class Pods {
  private store: Store
  private states: Array<State<any>> = []

  register(store: Store) {
    this.store = store
    this.states.forEach((state) => {
      state.setPath(store.getState())
    })
  }

  registerState(state: State<any>) {
    if (!this.states.includes(state)) {
      this.states.push(state)
    }
  }

  bindAction<S>(key: string, action: ActionCreator<S>, state: State<S>) {
    return (...args: any[]) => {
      this.triggerAction(state, {
        type: ActionTypes.ActionHandler,
        stateId: state.id,
        key,
        resolver: () => {
          action(...args)
        }
      })
    }
  }

  bindDraftFn(fn: DraftFn<any>, state: State<any>) {
    return () => {
      this.triggerAction(state, {
        type: ActionTypes.Draft,
        stateId: state.id,
        resolver: () => {
          fn(state.current)
        }
      })
    }
  }

  bindTrackerFn<T, S>(fn: StateTrackerFn<T, S>, state: State<S>, trackedState: State<T>) {
    trackedState.registerTrackerAction((curState, prevState) => {
      this.triggerAction(state, {
        type: ActionTypes.StateTracker,
        stateId: state.id,
        resolver: () => {
          fn(curState, prevState)
        }
      })
    })
  }

  triggerAction(state: State<any>, action: any) {
    this.store.dispatch(action)
    state.sideEffects()
  }
}
