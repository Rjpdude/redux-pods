import pods, { usePods } from '.'
import { createDraft, finishDraft, Draft } from 'immer'
import { DraftFn, StatefulActionSet, ActionSet } from './types'
import { ActionTypes } from './config'
import { findPath } from './util'
import get from 'lodash.get'

export class State<S> {
  private initialState: Readonly<S>
  private _draft: Draft<S>
  public current: Readonly<S>
  private path: string
  private actionMap = new Map<string, any>()
  private pendingDraftFn: { id: string, res: DraftFn<S> }
  private trackers = new Map<string, [any, any]>()
  private hooks: Array<(state: S) => void> = []
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

  registerAction(id: string, fn: any) {
    this.actionMap.set(id, fn)
  }

  registerDraftFn(fn: { id: string, res: DraftFn<S> }) {
    this.pendingDraftFn = fn
  }

  registerTracker(id: string, actionFn: (...args: any) => any, resFn: (state: any) => void) {
    this.trackers.set(id, [actionFn, resFn])
  }

  registerHook(fn: (state: S) => void) {
    if (typeof fn === 'function' && !this.hooks.includes(fn)) {
      this.hooks.push(fn)
    }
  }

  unregisterHook(fn: (state: S) => void) {
    if (typeof fn === 'function') {
      const index = this.hooks.indexOf(fn)
      if (index > -1) {
        this.hooks.splice(index, 1)
      }
    }
  }

  triggerTracker(id: string) {
    this.trackers.get(id)[0]()
  }

  triggerHooks() {
    this.hooks.forEach((fn) => {
      try {
        if (typeof fn === 'function') {
          fn(this.current)
        }
      } catch (error) {
        console.error('Error resolving hook callback fn.', error)
      }
    })
  }

  reducer = (_state: S, action: any) => {
    if (action.type.startsWith('pod-') && action.id) {
      this.resolveActionHandler(action)
      this.resolveDraftAction(action)
      this.resolveStateTrackerAction(action)
    }
    return this.current
  }

  resolveActionHandler(action: any) {
    if (action.type.startsWith(ActionTypes.ActionHandler) && this.actionMap.has(action.id)) {
      const actionCreator = this.actionMap.get(action.id)

      if (actionCreator) {
        this.resolveAction(() => {
          actionCreator(...action.args)
        })
      }
    }
  }

  resolveDraftAction(action: any) {
    if (action.type === ActionTypes.Draft && this.pendingDraftFn && this.pendingDraftFn.id === action.id) {
      this.resolveAction(() => {
        this.pendingDraftFn.res(this.draft)
      })
    }
  }

  resolveStateTrackerAction(action: any) {
    if (action.type === ActionTypes.StateTracker && this.trackers.has(action.id)) {
      this.resolveAction(() => {
        this.trackers.get(action.id)[1]()
      })
    }
  }

  resolveAction(fn: () => void) {
    this.locked = false

    try {
      fn()
    } catch(error) {
      console.log('Error resolving action handler.', error)
    } finally {
      this.locked = true
    }

    const res = this._draft ? finishDraft(this._draft) : this.current
    this._draft = undefined
    this.current = res as S
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

  track<P>(state: State<P>, fn: (podState: Readonly<P>) => S | void) {
    if (!(state instanceof State) || (state as any) === this) {
      throw new Error('Trackers must reference a different state object.')
    }
    pods.bindTrackerFn(fn, this, state)
  }

  use = () => {
    return usePods(this as State<S>)
  }

  getPath() {
    return this.path
  }
}
