import pods, {
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
} from '.'

import {
  isPrimitive,
  checkForPrimitive,
  unrwapPrimitive,
  findPath
} from './util'

import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, Draft } from 'immer'
import get from 'lodash.get'

export class State<S> {
  public readonly id = uuid()
  private path: string
  private locked = true

  private initialState: Readonly<S>
  private _draft: Draft<S>
  public current: Readonly<S>
  public previous: Readonly<S>
  private watchers: Set<WatcherCallback<S>>

  constructor(initialState: S) {
    this.initialState = checkForPrimitive(initialState)
    this.current = this.initialState
    this.init()
  }

  init() {
    if (this.initialState === null || this.initialState === undefined) {
      console.warn(
        'Pod states should not be initialized with null or undefined.'
      )
    }
    pods.registerState(this)
  }

  reducer = (state: S = this.initialState, action: InternalActionType<S>) => {
    if (action.type === ActionTypes.ResolvePrimitives) {
      const unwrapped = unrwapPrimitive(state)
      this.initialState = unwrapped
      this.current = unwrapped
      return unwrapped
    }

    let res = state
    try {
      if (action.stateId === this.id) {
        res = this.resolveAction(state, action.resolver)
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

  private unlock(state: Readonly<S>) {
    this.locked = false
    this.previous = state
  }

  private lock(state: Readonly<S>) {
    this.locked = true
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
      for (let watcherFn of this.watchers) {
        try {
          watcherFn(this.current, this.previous)
        } catch (error) {
          console.error('Error resolving watcher callback function.', error)
        }
      }
    }
  }

  get draft() {
    if (this.locked) {
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

  actions<O extends StatefulActionSet<S>>(obj: O): ActionSet<O> {
    return Object.entries(obj).reduce(
      (actionSet, [key, fn]) => ({
        ...actionSet,
        [key]: pods.createActionHandler(fn, this)
      }),
      {}
    ) as ActionSet<O>
  }

  track<P>(trackedState: Exposed<State<P>>, trackerFn: StateTrackerFn<P, S>) {
    if (!(trackedState instanceof State) || (trackedState as any) === this) {
      throw new Error('Trackers must reference a different state object.')
    }
    pods.createStateTracker(trackerFn, this, trackedState)
  }

  resolve(draftFn: DraftFn<S>) {
    pods.resolve(draftFn, this, ActionTypes.Draft, () => {
      return isPrimitive(this.current) ? (this.current as any) : this.draft
    })
  }

  watch(callback: WatcherCallback<S>) {
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

  use = (): Readonly<S> => {
    return usePods(this)
  }

  map(storeState: any): S {
    return get(storeState, this.path)
  }

  setPath(storeState: any) {
    try {
      this.path = findPath(storeState, this.initialState)
    } catch (error) {
      console.error(
        'Unable to located state path within redux store tree.',
        this.initialState
      )
    }
  }

  getPath() {
    return this.path
  }
}
