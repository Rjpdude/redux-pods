import pods, { usePods } from '.'
import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, Draft } from 'immer'
import { ActionResolver, InternalActionType, DraftFn, StatefulActionSet, ActionSet, Exposed, StateTrackerFn, HookFn } from './types'
import { findPath } from './util'
import get from 'lodash.get'

export class State<S> {
  public readonly id = uuid()

  private initialState: Readonly<S>
  private _draft: Draft<S>
  public current: Readonly<S>
  public previous: Readonly<S>
  private trackerFn: StateTrackerFn<S, any>
  private hooks: Set<HookFn<S>>
  private path: string
  private locked = true

  constructor(initialState: S) {
    this.initialState = initialState
    this.current = initialState
    pods.registerState(this)
  }

  get draft() {
    if (this.locked) {
      throw new Error('State drafts can only be accessed within action creator or resolver functions.')
    }
    return this._draft || (this._draft = createDraft(this.current))
  }

  setPath(storeState: any) {
    this.path = findPath(storeState, this.initialState)
  }

  map(storeState: any): S {
    return get(storeState, this.getPath())
  }

  sideEffects() {
    if (!Object.is(this.current, this.previous)) {
      this.triggerHooks()
      this.triggerTrackers()
    }
  }

  private triggerHooks() {
    if (this.hooks) {
      for (let hookFn of this.hooks) {
        try {
          hookFn(this.current)
        } catch (error) {
          console.error('Error resolving hook resolver function', error)
        }
      }
    }
  }

  private triggerTrackers() {
    if (this.trackerFn) {
      this.trackerFn(this.current, this.previous)
    }
  }

  registerHook(hookFn: HookFn<S>) {
    if (typeof hookFn !== 'function') {
      throw new Error('Hook function resolvers must be of type function.')
    }

    if (!this.hooks) {
      this.hooks = new Set()
    }

    if (this.hooks.has(hookFn)) {
      throw new Error('This hook function resolver has already been registered.')
    }

    this.hooks.add(hookFn)
  }

  unregisterHook(hookFn: HookFn<S>) {
    if (typeof hookFn !== 'function') {
      throw new Error(`Unable to unregister hook resolver function of type ${typeof hookFn}`)
    }

    if (!this.hooks || !this.hooks.has(hookFn)) {
      throw new Error('Unable to locate hook resolver function.')
    }
    
    this.hooks.delete(hookFn)
  }

  registerTrackerAction(trackerAction: StateTrackerFn<S, any>) {
    const currentFn = this.trackerFn

    this.trackerFn = !currentFn 
      ? trackerAction 
      : (...states) => {
        currentFn(...states)
        trackerAction(...states)
      }
  }

  reducer = (state: S = this.initialState, action: InternalActionType) => {
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

  private resolveAction(state: Readonly<S>, resolver: ActionResolver) {
    if (typeof resolver !== 'function') {
      throw new Error('Pod actions must contain a resolver of type function.')
    }

    this.unlock(state)
    resolver()

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

  resolve(draftFn: DraftFn<S>) {
    pods.bindDraftFn(draftFn, this)()
  }

  actions<O extends StatefulActionSet<S>>(obj: O): ActionSet<O> {
    return Object.entries(obj).reduce((actionSet, [key,fn]) => ({
      ...actionSet,
      [key]: pods.bindAction(key, fn, this),
    }), {}) as ActionSet<O>
  }

  track<P>(trackedState: Exposed<State<P>>, trackerFn: StateTrackerFn<P, S>) {
    if (!(trackedState instanceof State) || (trackedState as any) === this) {
      throw new Error('Trackers must reference a different state object.')
    }
    pods.bindTrackerFn(trackerFn, this, trackedState)
  }

  use = (): S => {
    return usePods(this)
  }

  getPath() {
    return this.path
  }
}
