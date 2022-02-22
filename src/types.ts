import { Draft } from 'immer'
import { State } from './exports'
import { Reducer } from 'redux'

export enum ActionTypes {
  ResolveNext = 'pod-action-resolve-next',
  ActionHandler = 'pod-action-handler',
  Draft = 'pod-action-draft',
  StateTracker = 'pod-action-state-tracker',
  ResolvePrimitives = 'pod-action-resolve-primitives'
}

export interface InternalActionType<S> {
  type: ActionTypes
  stateId?: string
  actionKey?: string
  resolver?: ActionResolver<S>
}

export type ActionResolver<S> = () => S | void
export type DraftFn<S> = (draft: Draft<S>) => S | void
export type ActionCreator<S> = (...args: any[]) => S | void
export type StateTrackerFn<T, S> = (
  podState: Readonly<T>,
  prevPodState: Readonly<T>
) => S | void
export type WatcherCallback<S> = (
  curState: Readonly<S>,
  prevState?: Readonly<S>
) => void

export interface StateHook<S> {
  (): Readonly<S>
  <K extends keyof S>(stateKey: K): Readonly<S[K]>
  <K extends keyof S>(...stateKeys: K[]): Readonly<
    {
      [P in K]: S[P]
    }
  >
  //<F extends HookMapperFn<S>>(mapperFn: F): ReturnType<F>
}

//export type HookMapperFn<S> = (state: S) => any

export interface StatefulActionSet<S> {
  [key: string]: ActionCreator<S>
}

export type ActionSet<O extends StatefulActionSet<any>> = {
  [K in keyof O]: (...args: Parameters<O[K]>) => void
}

export type ExtractStateType<S> = S extends State<infer T> ? T : unknown

export type Exposed<S extends State<any>> = Reducer<ExtractStateType<S>> &
  Omit<
    S,
    | 'setPath'
    | 'registerAction'
    | 'registerDraftFn'
    | 'registerTracker'
    | 'registerHook'
    | 'unregisterHook'
    | 'triggerTracker'
    | 'triggerHooks'
    | 'previous'
    | 'sideEffects'
    | 'reducer'
    | 'actionsLocked'
    | 'registerWatchFn'
  > & {
    instance: S
  }

export type InferStates<A> = {
  [K in keyof A]: A[K] extends Exposed<State<infer T>> ? Readonly<T> : unknown
}
