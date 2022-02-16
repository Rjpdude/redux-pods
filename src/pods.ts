import { Store } from 'redux'
import { State } from './state'
import { v4 as uuid } from 'uuid'
import { DraftFn, ActionCreator } from './types'
import { ActionTypes } from './config'

export class Pods {
  private store: Store
  private states: Array<State<any>> = []
  private stateTrackers = new Map<State<any>, Map<string, State<any>>>()

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

  bindAction(key: string, action: ActionCreator<any>, state: State<any>) {
    const id = uuid()
    
    const actionFn = (...args: any[]) => this.bindFn(state, {
      type: `${ActionTypes.ActionHandler}-${key}`,
      args,
      id,
    })

    state.registerAction(id, action)
    return actionFn
  }

  bindDraftFn(fn: DraftFn<any>, state: State<any>) {
    const id = uuid()

    const actionFn = () => this.bindFn(state, {
      type: ActionTypes.Draft,
      id,
    })

    state.registerDraftFn({ id, res: fn })
    return actionFn
  }

  bindTrackerFn(fn: (podState: any) => any, state: State<any>, trackedState: State<any>) {
    const id = uuid()

    const actionFn = () => this.bindFn(state, {
      type: ActionTypes.StateTracker,
      id,
    })

    if (!this.stateTrackers.has(trackedState)) {
      this.stateTrackers.set(trackedState, new Map())
    }
    this.stateTrackers.get(trackedState).set(id, state)

    state.registerTracker(id, actionFn, () => fn(trackedState.current))
    return actionFn
  }

  resolveTrackers(tracked: State<any>) {
    if (this.stateTrackers.has(tracked)) {
      const map = this.stateTrackers.get(tracked)

      for (const [id, state] of map.entries()) {
        state.triggerTracker(id)
      }
    }
  }

  bindFn(state: State<any>, action: any) {
    this.store.dispatch(action)
    state.triggerHooks()
    this.resolveTrackers(state)
  }
}
