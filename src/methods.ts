import { AnyAction } from 'redux'
import { PodReducer } from './reducer'
import { isPod, isActionSet, isProxiedAction } from './util'
import { mapStateFromPath, mapStateFromFunction } from './state'
import { chainedActionSet } from './actionset'
import { podTrackerEffect, actionTrackerEffect } from './tracker'
import { actionTypeEffect, internalReducerEffect } from './effect'

import {
  ChainedPod,
  ActionSet,
  ExplicitlyTypedAction,
  Effect,
  ResolvedPodTracker,
  ResolvedActionTracker,
  ExposedActionCreator
} from './interfaces'

export class PodMethods<S, A extends ActionSet<S>> {
  constructor(instance: PodReducer<S, A>) {
    this.instance = () => instance
  }

  path() {
    return this.props().path
  }

  connected() {
    return this.props().connected
  }

  actionSet() {
    return this.props().actionSet
  }

  props() {
    return this.instance().getProps()
  }

  instance(): PodReducer<S, A> {
    return undefined
  }

  mapState(storeState: any): S
  mapState<P extends keyof S>(storeState: any, ...subPath: P[]): Pick<S, P>
  mapState<R extends any>(
    storeState: any,
    selector: (state: S) => R
  ): R extends void ? S : R

  mapState(storeState: any, ...selector: any[]) {
    return typeof selector[0] === 'function'
      ? mapStateFromFunction(selector[0], storeState, this.path(), [])
      : mapStateFromPath(
          storeState,
          this.path(),
          typeof selector[0] !== 'string' ? undefined : selector
        )
  }

  on<N extends ActionSet<S>>(actions: N): ChainedPod<S, A & N>
  on<T extends any>(
    actionType: string | string[],
    effect: Effect<S, T>
  ): ChainedPod<S, A>

  on(...args: any) {
    const actionSet = isActionSet(args[0])

    if (args.length === 0 || (!actionSet && typeof args[0] !== 'string')) {
      throw new Error(
        `Invalid argument of type ${typeof args[0]}; expected action set obj. or action type string.`
      )
    }

    return this.instance().chain<any, any>(
      actionSet
        ? {
            actionSet: chainedActionSet(
              this.instance,
              this.actionSet(),
              args[0]
            )
          }
        : {
            effectChain: actionTypeEffect(
              typeof args[0] === 'string' ? [args[0]] : args[0],
              args[1]
            )
          }
    )
  }

  track<TState>(
    pod: ChainedPod<TState, any>,
    tracker: ResolvedPodTracker<TState, S>
  ): ChainedPod<S, A>

  track<TAction extends ExposedActionCreator<any>>(
    action: TAction,
    tracker: ResolvedActionTracker<TAction, S>
  ): ChainedPod<S, A>

  track(toTrack: any, tracker: any) {
    const pod = isPod(toTrack)
    const action = !pod && isProxiedAction(toTrack)

    if (!pod && !action) {
      throw new Error(
        `Invalid tracker reference; expected pod or pod action, but got: ${typeof toTrack}`
      )
    }

    return this.instance().chain<S, A>(
      pod
        ? {
            trackers: new Map(this.props().trackers).set(
              toTrack.instance,
              tracker
            ),
            effectChain: podTrackerEffect(toTrack, tracker)
          }
        : {
            effectChain: actionTrackerEffect(toTrack, tracker)
          }
    )
  }

  reduce(effect: Effect<S, ExplicitlyTypedAction<keyof A>>) {
    return this.instance().chain<S, A>({
      effectChain: internalReducerEffect(this.actionSet(), effect)
    })
  }

  reduceAny<T extends AnyAction>(effect: Effect<S, T>) {
    return this.instance().chain<S, A>({
      effectChain: effect
    })
  }

  extend<ExtendedState>(extendedState?: ExtendedState) {
    const initialState = this.props().initialState

    if (
      extendedState !== undefined &&
      typeof extendedState !== typeof initialState
    ) {
      throw new Error(
        `An extended initial state must be of the same type as the existing initial state declaration.`
      )
    }

    return this.instance().chain<S & ExtendedState, A & {}>(
      typeof extendedState !== undefined
        ? {
            initialState:
              typeof extendedState === 'string' ||
              typeof extendedState === 'boolean' ||
              typeof extendedState === 'number' ||
              typeof extendedState === 'bigint'
                ? { initialState: extendedState }
                : {
                    ...initialState,
                    ...extendedState
                  }
          }
        : {}
    )
  }
}
