import { Draft } from 'immer'
import { State } from './state'

export enum ActionTypes {
  ActionHandler = 'pod-action-handler',
  Draft = 'pod-action-draft',
  StateTracker = 'pod-action-state-tracker',
}

export interface InternalActionType {
  type: ActionTypes
  stateId: string
  actionKey?: string
  resolver: ActionResolver
}

export type ActionResolver = () => void
export type DraftFn<S> = (state: Draft<S>) => Draft<S> | void
export type ActionCreator<S> = (...args: any[]) => S | void
export type StateTrackerFn<T, S> = (podState: Readonly<T>, prevPodState?: Readonly<T>) => S | void
export type HookFn<S> = (state: S) => void

export interface StatefulActionSet<S> {
    [key: string]: ActionCreator<S>
}

export type ActionSet<O extends StatefulActionSet<any>> = {
  [K in keyof O]: (...args: Parameters<O[K]>) => void
}

export type Exposed<S extends State<any>> = Omit<S, 
  'setPath' | 'registerAction' | 'registerDraftFn' | 'registerTracker' | 'registerHook' |
  'unregisterHook' | 'triggerTracker' | 'triggerHooks' | 'previous'
>

export type InferStates<A> = {
  [K in keyof A]: A[K] extends Exposed<State<infer T>> ? T : unknown
}
