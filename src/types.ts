import { Draft } from 'immer'
import { State } from './exports'
import { Reducer } from 'redux'

export enum ActionTypes {
  Transmitter = 'pod-action-transmitter',
  ActionHandler = 'pod-action-handler',
  Draft = 'pod-action-draft',
  StateTracker = 'pod-action-state-tracker',
  ResolvePrimitives = 'pod-action-resolve-primitives'
}

export interface InternalActionType<S> {
  type: ActionTypes
  stateId?: string
  transmitterId?: string
  transmittedData?: any
  actionKey?: string
  resolver?: ActionResolver<S>
}

export interface Transmitter<T> {
  (data: T): void
  id: Readonly<string>
}

export type TransmitReolver<T, S> = (data: T, draft: Draft<S>) => S | void

export type ActionResolver<S> = () => S | void
export type DraftFn<S> = (draft: Draft<S>) => S | void
export type ActionCreator<S> = (...args: any[]) => S | void
export type StateTrackerFn<T, S> = (
  podState: Readonly<T>,
  prevPodState?: Readonly<T>
) => S | void
export type WatcherCallback<S> = (
  curState: Readonly<S>,
  prevState?: Readonly<S>
) => void

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
  >

export type InferStates<A> = {
  [K in keyof A]: A[K] extends Exposed<State<infer T>> ? Readonly<T> : unknown
}
