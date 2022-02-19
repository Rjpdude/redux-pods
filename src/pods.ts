import { Store } from 'redux'
import { v4 as uuid } from 'uuid'
import { State, ActionTypes, ActionCreator, StateTrackerFn, Transmitter } from './exports'
import { resolveStatePaths } from './util'

export class Pods {
  private store: Store
  private states = new Set<State<any>>()

  register(store: Store) {
    this.store = store
    this.setStatePaths(store.getState())
  }

  setStatePaths(storeState: any) {
    resolveStatePaths(storeState, new Set(this.states))

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

  createTransmitterFn<T>(): Transmitter<T> {
    const id = uuid()
    const dispatch = (a: any) => this.store.dispatch(a)

    function transmitterFn(data: T) {
      dispatch({
        type: ActionTypes.Transmitter,
        transmitterId: id,
        transmittedData: data,
      })
    }
    transmitterFn.id = id
    
    return transmitterFn
  }

  createActionHandler<S>(action: ActionCreator<S>, state: State<S>) {
    return (...args: any[]) => {
      if (state.actionsLocked) {
        throw new Error(
          'To prevent race conditions, state actions cannot be called within watcher functions.'
        )
      }
      this.resolve(action, state, ActionTypes.ActionHandler, ...args)
    }
  }

  createStateTracker<T, S>(
    fn: StateTrackerFn<T, S>,
    state: State<S>,
    trackedState: State<T>
  ) {
    trackedState.watch((...states) => {
      this.resolve(fn, state, ActionTypes.StateTracker, ...states)
    })
  }

  resolve<T extends (...args: any[]) => any>(
    fn: T,
    state: State<any>,
    type: ActionTypes,
    ...args: Parameters<T> | [() => Parameters<T>]
  ) {
    this.triggerAction(state, {
      type,
      stateId: state.id,
      resolver: () => {
        return fn(...(typeof args[0] === 'function' ? [args[0]()] : args))
      }
    })
  }

  triggerAction(state: State<any>, action: any) {
    this.store.dispatch(action)
    state.sideEffects()
  }
}
