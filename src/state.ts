import {
  podsInstance,
  usePods,
  ActionTypes,
  ActionResolver,
  InternalActionType,
  Transmitter,
  TransmitReolver,
  DraftFn,
  StatefulActionSet,
  ActionCreator,
  ActionSet,
  Exposed,
  StateTrackerFn,
  WatcherCallback,
  StateHook,
  getReact
} from './exports'

import { isPrimitive, wrap, unwrap, mapStateValues } from './util'

import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, Draft } from 'immer'
import get from 'lodash.get'

export class State<S = any> {
  /**
   * The state's unique id. Used internally to track action handlers.
   */
  public readonly id = uuid()

  /**
   * The state's path within the redux store tree.
   */
  private path: string

  /**
   * The initial state value.
   */
  private initialState: Readonly<S>

  /**
   * The drafted state value, set when a state resolver function accesses the `draft` member.
   */
  private _draft: Draft<S> | undefined

  /**
   * A map of callbacks to resolve incoming data transmittance.
   */
  private transmitFnMap: Map<string, TransmitReolver<any, S>>

  /**
   * The state's lock status. When true, it prevents a state draft from being created.
   * This should only ever be false when resolving an action within the reducer.
   */
  private draftLocked = true

  /**
   * Used to block access to action handlers when resolving state watcher functions. This
   * prevents race conditions.
   */
  public actionsLocked = false

  /**
   * The next state to apply to the redux store.
   */
  private next: Readonly<S>

  /**
   * The state's current value within the redux store.
   */
  public current: Readonly<S>

  /**
   * The previous state value.
   */
  public previous: Readonly<S>

  /**
   * A set of state watcher callback functions, which may or may not have access to modify the draft.
   * Called outside of the reducer after a change has been detected in the state value.
   */
  private watchers: Set<WatcherCallback<S>>

  constructor(initialState: S) {
    if (initialState === null || initialState === undefined) {
      throw new Error(
        'Pod states should cannot be initialized with null or undefined.'
      )
    }

    this.initialState = wrap(initialState)
    this.current = this.initialState

    podsInstance.registerState(this)
  }

  reducer(state: S = this.initialState, action: InternalActionType<S>) {
    if (action.type === ActionTypes.ResolvePrimitives) {
      return this.resolveWrappedState(state)
    }

    if (action.type === ActionTypes.ResolveNext) {
      const next = this.next

      if (next !== undefined) {
        this.next = undefined as any
        return next
      }
    }
    return state

    // let res = state
    // try {
    //   if (this._draft) {
    //     res = this.resolveAction(state, () => {
    //       return finishDraft(this._draft) as S
    //     })
    //   } else if (action.stateId === this.id) {
    //     res = this.resolveAction(state, action.resolver as ActionResolver<S>)
    //   }
    // } catch (error) {
    //   console.error('Error resolving pod state action handler.', error)
    // } finally {
    //   this.lock(res)
    // }
    // return res
  }

  public trackers = new Map<State<any>, StateTrackerFn<S, any>>()

  public resolveNext = (finalize: boolean, resolver: ActionResolver<S>) => {
    let next = this.current

    this.draftLocked = false

    const res = resolver()

    this.draftLocked = true

    if (res !== undefined && res !== this._draft) {
      next = res
    } else if (this._draft) {
      next = finishDraft(this._draft) as S
    }

    if (next !== this.current) {
      this.next = next
      this.previous = this.current
      this.current = this.next
      this._draft = undefined

      for (const [a, b] of this.trackers) {
        a.resolveNext(false, () => {
          b(this.next, this.previous)
        })
      }

      podsInstance.setUpdatedState(this)

      if (finalize) {
        podsInstance.next()
      }
    }
  }

  // private resolveAction(state: Readonly<S>, resolver: ActionResolver<S>) {
  //   if (typeof resolver !== 'function') {
  //     throw new Error('Pod actions must contain a resolver of type function.')
  //   }

  //   this.unlock(state)

  //   const res = resolver()
  //   if (res !== undefined && res !== this._draft) {
  //     return res as S
  //   }
  //   return (this._draft ? finishDraft(this._draft) : state) as S
  // }

  private resolveWrappedState(state: S) {
    const unwrapped = unwrap(state)
    this.initialState = unwrapped
    this.current = unwrapped
    return unwrapped
  }

  // private unlock(state: Readonly<S>) {
  //   this.draftLocked = false
  //   this.previous = state
  // }

  // private lock(state: Readonly<S>) {
  //   this.draftLocked = true
  //   this.current = state
  //   this._draft = undefined
  // }

  // setDraftLock = (draftLocked: boolean) => {
  //   this.draftLocked = draftLocked
  // }

  public triggerWatchers = () => {
    if (this.watchers) {
      for (const watcherFn of this.watchers) {
        try {
          watcherFn(this.current, this.previous)
        } catch (error) {
          console.error('Error resolving watcher callback function.', error)
        }
      }
    }
  }

  get draft() {
    const currentState = this.next === undefined ? this.current : this.next

    if (this.draftLocked) {
      throw new Error(
        'State drafts can only be accessed within action creator or resolver functions.'
      )
    }

    if (isPrimitive(currentState)) {
      throw new Error(
        `Primitive state values cannot be drafted - consider using 'current' instead.`
      )
    }

    return this._draft || (this._draft = createDraft(currentState))
  }

  action<A extends ActionCreator<S>>(
    actionHandler: A
  ): (...args: Parameters<A>) => void {
    return podsInstance.createActionHandler(actionHandler, this)
  }

  on<T>(transmitter: Transmitter<T>, fn: TransmitReolver<T, S>) {
    if (!this.transmitFnMap) {
      this.transmitFnMap = new Map()
    }

    if (this.transmitFnMap.has(transmitter.id)) {
      throw new Error('This state already has a resolver for this transmitter.')
    }

    this.transmitFnMap.set(transmitter.id, fn)
  }

  actionSet<O extends StatefulActionSet<S>>(obj: O): ActionSet<O> {
    return Object.entries(obj).reduce(
      (actionSet, [key, fn]) => ({
        ...actionSet,
        [key]: podsInstance.createActionHandler(fn, this)
      }),
      {}
    ) as ActionSet<O>
  }

  track<P>(trackedState: Exposed<State<P>>, trackerFn: StateTrackerFn<P, S>) {
    if (!(trackedState instanceof State) || (trackedState as any) === this) {
      throw new Error('Trackers must reference a different state object.')
    }
    if (trackedState.trackers.has(this)) {
      throw new Error('A tracker has already been created for this state.')
    }
    trackedState.trackers.set(this, trackerFn)

    //podsInstance.createStateTracker(trackerFn, this, trackedState)
  }

  resolve(draftFn: DraftFn<S>) {
    this.resolveNext(true, () => {
      draftFn(isPrimitive(this.current) ? (this.current as any) : this.draft)
    })
    // podsInstance.resolve(draftFn, this, ActionTypes.Draft, () => {
    //   return isPrimitive(this.current) ? (this.current as any) : this.draft
    // })
  }

  watch = (callback: WatcherCallback<S>) => {
    return podsInstance.createStateTracker([this], () => {
      this.actionsLocked = true

      try {
        callback(this.current, this.previous)
      } catch (error) {
        console.error('Error resolving watcher callback function.', error)
      } finally {
        this.actionsLocked = false
      }
    })
    // return this.registerWatchFn((...args) => {
    //   this.actionsLocked = true

    //   try {
    //     callback(...args)
    //   } finally {
    //     this.actionsLocked = false
    //   }
    // })
  }

  registerWatchFn(callback: WatcherCallback<S>) {
    if (typeof callback !== 'function') {
      throw new Error(
        `Unable to register state watcher callback of type ${typeof callback}.`
      )
    }

    if (!this.watchers) {
      this.watchers = new Set()
    }

    if (this.watchers.has(callback)) {
      throw new Error(
        'Unable to register state watcher callback - already registered.'
      )
    }

    this.watchers.add(callback)

    return () => {
      this.watchers.delete(callback)
    }
  }

  use: StateHook<S> = (...args: any[]) => {
    const React = getReact()

    const resolveStateFromArg = () => {
      if (args.length === 0) {
        return this.current
      }
      if (args.length === 1) {
        return this.current[args[0] as keyof S]
      }
      return Object.entries(this.current).reduce(
        (obj, [key, val]) =>
          !args.includes(key)
            ? obj
            : {
                ...obj,
                [key]: val
              },
        {}
      )
    }

    const [state, setState] = React.useState(resolveStateFromArg)

    React.useEffect(() => {
      return podsInstance.createStateTracker([this], () => {
        setState((cur: any) => {
          const next = resolveStateFromArg() as S

          if (args.length > 1) {
            /** return current state to bail out of an update when none of the properties have changed */
            return Object.entries(cur as S).some(
              ([key, val]) => !Object.is(val, next[key as keyof S])
            )
              ? next
              : cur
          }

          return next
        })
      })
    }, [])

    return state
  }

  map(storeState: any): S {
    return get(storeState, this.path)
  }

  setPath(path: string) {
    this.path = path
  }

  getPath() {
    return this.path
  }
}
