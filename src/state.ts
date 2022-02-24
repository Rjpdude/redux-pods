import {
  podsInstance,
  ActionTypes,
  ActionResolver,
  InternalActionType,
  getReact,
  ObserverType
} from './exports'

import { observe } from '.'
import { isPrimitive, wrap, unwrap } from './util'

import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, isDraft, current, enableMapSet, Draft } from 'immer'
import get from 'lodash.get'
import { ResolutionStatus } from './types'

enableMapSet()

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
   * The next state as a mutable Draft object - applied after the resolution callstack.
   */
  private next: Draft<S>

  private lastProducedDraft: Readonly<S>

  /**
   * The state's current value within the redux store
   */
  private current: Readonly<S>

  /**
   * The previous state value.
   */
  public previous: Readonly<S>

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

  reducer(state: S = this.initialState, action: InternalActionType) {
    if (action.type === ActionTypes.ResolveNext && this.lastProducedDraft !== undefined) {
      return this.lastProducedDraft
    }
    return state
  }

  applyInternalState() {
    if (this.lastProducedDraft) {
      this.previous = this.current
      this.current = this.lastProducedDraft
    }
    this.lastProducedDraft = undefined as any
    this.next = undefined as any
  }

  checkDraftUpdate() {
    if (!isDraft(this.next)) {
      return false
    }

    this.lastProducedDraft = finishDraft(createDraft(current(this.next))) as any

    return this.lastProducedDraft !== this.getState()
  }

  getProxiedState() {
    if (
      podsInstance.resolvingWithin(
        ResolutionStatus.ActionHandler,
        ResolutionStatus.ConcurrentAction
      )
    ) {
      if (this.next === undefined) {
        try {
          this.next = createDraft(this.getState())
        } catch (error) {
          console.error(
            'Error drafting state object from current state.',
            this.getState(),
            error
          )
        }
      }

      if (isDraft(this.next)) {
        podsInstance.setUpdatedState(this)
        return this.next
      }
    }
    return this.getState()
  }

  use(): Readonly<S>
  use<K extends keyof S>(stateKey: K): Readonly<S[K]>
  use<K extends keyof S>(
    ...stateKeys: K[]
  ): Readonly<
    {
      [P in K]: S[P]
    }
  >
  use(...args: any[]) {
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
      return observe(this, () => {
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

  getInstance() {
    return this
  }

  getState() {
    return this.current
  }

  mapState(storeState: any): S {
    return get(storeState, this.path)
  }

  setPath(path: string) {
    this.path = path
  }

  getPath() {
    return this.path
  }
}
