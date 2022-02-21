import { Store } from 'redux'
import { v4 as uuid } from 'uuid'
import { State, ActionTypes, ActionCreator, Transmitter } from './exports'
import { resolveStatePaths } from './util'

export class Pods {
  private store: Store
  private states = new Set<State>()
  private updatedStates = new Set<State>()
  private stateTrackers = new Map<State[], () => void>()
  private synchronized = false

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

    for (const state of this.updatedStates) {
      state.triggerWatchers()
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

  synchronizeActionHandlers(fn: () => void) {
    this.synchronized = true

    try {
      fn()
    } finally {
      this.synchronized = false
    }

    this.next()
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

      // state.setDraftLock(false)
      // const res = action(...args)
      
      // if (this.trackers.has(state)) {
      //   const val = this.trackers.get(state)

      //   if (val) {
      //     val.state.setDraftLock(false)
      //     val.fn(finishDraft(createDraft(current(state.draft))) as any, state.current)
      //     val.state.setDraftLock(true)
      //   }
      // }
      // state.setDraftLock(true)

      // this.resolve(() => res, state, ActionTypes.ActionHandler)
    }
  }

  // createStateTracker<T, S>(
  //   fn: StateTrackerFn<T, S>,
  //   state: State<S>,
  //   trackedState: State<T>
  // ) {
  //   this.trackers.set(trackedState, { state, fn })
  //   trackedState.watch((...states) => {
  //     this.resolve(fn, state, ActionTypes.StateTracker, ...states as any)
  //   })
  // }

  // resolve<T extends (...args: any[]) => any>(
  //   fn: T,
  //   state: State<any>,
  //   type: ActionTypes,
  //   ...args: Parameters<T> | [() => Parameters<T>]
  // ) {
  //   this.triggerAction(state, {
  //     type,
  //     stateId: state.id,
  //     resolver: () => {
  //       return fn(...(typeof args[0] === 'function' ? [args[0]()] : args))
  //     }
  //   })
  // }

  // triggerAction(state: State<any>, action: any) {
  //   this.store.dispatch(action)
  //   state.sideEffects()
  // }

  next() {
    if (!this.synchronized) {
      this.store.dispatch({
        type: ActionTypes.ResolveNext
      })
    }
  }
}
