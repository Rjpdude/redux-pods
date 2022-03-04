import {
  podsInstance,
  ActionTypes,
  InternalActionType,
  ResolutionStatus
} from './exports'

import { v4 as uuid } from 'uuid'
import { createDraft, finishDraft, isDraft, enableMapSet, Draft } from 'immer'
import get from 'lodash.get'

enableMapSet()

export class State<S = any> {
  public readonly id = uuid()

  private path: string
  private initialState: Readonly<S>
  private computePathMap = new Map<string[], (val: State | string) => void>()

  private next: Draft<S>
  public current: Readonly<S>
  public previous: Readonly<S>

  constructor(initialState: S) {
    if (initialState === null || initialState === undefined) {
      throw new Error(
        'Pod states should cannot be initialized with null or undefined.'
      )
    }

    this.current = finishDraft(createDraft(initialState)) as S
    this.initialState = this.current
    // this.initialState = produce(initialState, wrapPrimitives)

    podsInstance.registerState(this)
  }

  reducer(state: S = this.current, action: InternalActionType) {
    if (action.type === ActionTypes.ResolveNext) {
      return this.applyNextState()
    }
    return state
  }

  applyNextState() {
    this.previous = this.current

    if (isDraft(this.next)) {
      const nextImmutableState = finishDraft(this.next)

      this.next = undefined as any
      this.current = nextImmutableState as S
    }

    return this.current
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
        return this.next
      }
    }

    if (podsInstance.resolvingWithin(ResolutionStatus.ConsecutiveAction)) {
      return this.getState()
    }

    return this.initialState
  }

  onPropertyUpdate(value: any, path: string) {
    const lastValue = get(this.getState(), path)

    if (Object.is(value, lastValue)) {
      return
    }

    for (const [paths, fn] of this.computePathMap) {
      if (paths.includes(path)) {
        fn(path)
      }
    }

    podsInstance.setUpdatedState(this)
  }

  registerComputePaths(paths: string[], fn: (val: any) => void) {
    this.computePathMap.set(paths, fn)
  }

  mapState(storeState: any): S {
    return get(storeState, this.path)
  }

  setPath(path: string) {
    this.path = path
  }

  getInstance() {
    return this
  }

  getState() {
    return this.current
  }

  getPreviousState() {
    return this.previous || this.current
  }

  getInitialState() {
    return this.initialState
  }

  getPath() {
    return this.path
  }
}
