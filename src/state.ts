import {
  podsInstance,
  usePods,
  ActionTypes,
  ActionResolver,
  InternalActionType,
  DraftFn,
  StatefulActionSet,
  ActionSet,
  Exposed,
  StateTrackerFn,
  WatcherCallback
} from './exports'

import { isPrimitive, wrap, unwrap } from './util'

import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, Draft } from 'immer'
import get from 'lodash.get'

export class State<S> {
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

    let res = state
    try {
      if (action.stateId === this.id) {
        res = this.resolveAction(state, action.resolver as ActionResolver<S>)
      }
    } catch (error) {
      console.error('Error resolving pod state action handler.', error)
    } finally {
      this.lock(res)
    }
    return res
  }

  private resolveAction(state: Readonly<S>, resolver: ActionResolver<S>) {
    if (typeof resolver !== 'function') {
      throw new Error('Pod actions must contain a resolver of type function.')
    }

    this.unlock(state)

    const res = resolver()
    if (res !== undefined && res !== this._draft) {
      return res as S
    }
    return (this._draft ? finishDraft(this._draft) : state) as S
  }

  private resolveWrappedState(state: S) {
    const unwrapped = unwrap(state)
    this.initialState = unwrapped
    this.current = unwrapped
    return unwrapped
  }

  private unlock(state: Readonly<S>) {
    this.draftLocked = false
    this.previous = state
  }

  private lock(state: Readonly<S>) {
    this.draftLocked = true
    this.current = state
    this._draft = undefined
  }

  sideEffects() {
    if (!Object.is(this.current, this.previous)) {
      this.triggerWatchers()
    }
  }

  private triggerWatchers() {
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
    if (this.draftLocked) {
      throw new Error(
        'State drafts can only be accessed within action creator or resolver functions.'
      )
    }
    if (isPrimitive(this.current)) {
      throw new Error(
        `Primitive state values cannot be drafted - consider using 'current' instead.`
      )
    }
    return this._draft || (this._draft = createDraft(this.current))
  }

  /**
   * Generate a collection of stateful action handlers, which can access the `draft` property
   * to effect changes to the state's object in redux.
   *
   * @param obj - The object of stateful action handlers.
   */
  actions<O extends StatefulActionSet<S>>(obj: O): ActionSet<O> {
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
    podsInstance.createStateTracker(trackerFn, this, trackedState)
  }

  resolve(draftFn: DraftFn<S>) {
    podsInstance.resolve(draftFn, this, ActionTypes.Draft, () => {
      return isPrimitive(this.current) ? (this.current as any) : this.draft
    })
  }

  watch(callback: WatcherCallback<S>) {
    return this.registerWatchFn((...args) => {
      this.actionsLocked = true

      try {
        callback(...args)
      } finally {
        this.actionsLocked = false
      }
    })
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

  use(): Readonly<S> {
    return usePods(this)
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
