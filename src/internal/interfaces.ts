import { AnyAction } from 'redux'
import { ProxiedAction } from '../actions/proxied_action'
import { PodReducer } from '../reducer/reducer'
import { PodMethods } from '../reducer/methods'

// -- Redux Reducer Type -- //

export type Reducer<S> = (state: S, action: AnyAction) => S

// -- Pod Types -- //

export type ChainedPod<S, A extends ActionSet<S>> = Reducer<S> &
  ExposedActionSet<A> &
  PodMethods<S, A>

export interface PodInstance {
  (): PodReducer<any, any>
}

// -- Action Types -- //

export interface ActionSet<S = {}> {
  [key: string]: ActionCreator<S>
}

export interface ActionCreator<S = {}> {
  (...args: any[]): AnyAction | Effect<S, any>
}

export interface ExplicitlyTypedAction<T> {
  type: T
}

export interface Effect<S, A> {
  (draft: S, arg?: A): S | void
}

export type StateResetAction = () => Effect<any, any>

// -- Tracker Types -- //

export interface ResolvedPodTracker<T, S> {
  (current?: T, previous?: T): Effect<S, never>
}

export interface ResolvedActionTracker<A extends ExposedActionCreator<any>, S> {
  (...args: ExposedActionCreatorRes<A>['arguments']): Effect<S, any>
}

// -- Proxied Action Types -- //

export type ProxiedActionSet<A extends ActionSet> = {
  [K in keyof A]: ProxiedAction<A[K]>
}

export interface ProxiedActionMembers<A extends ActionCreator> {
  instance(): ProxiedAction<A>
}

export interface InternalProxiedAction<A extends ActionCreator> {
  (...args: Parameters<A>): {
    arguments?: Parameters<A>
    type: string
  }
}

export type ExposedActionSet<A extends ActionSet> = {
  [K in keyof A]: ExposedActionCreator<A[K]>
}

export interface ExposedActionCreator<A extends ActionCreator>
  extends ProxiedActionMembers<A> {
  (...args: Parameters<A>): void
}

export type ExposedActionCreatorRes<A> = A extends ExposedActionCreator<infer C>
  ? ReturnType<InternalProxiedAction<C>>
  : unknown
