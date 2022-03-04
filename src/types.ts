import { State } from './exports'

export type BranchMapObject<T = any> = {
  [K in keyof T]: PodState<T[K]>
}

export enum ResolutionStatus {
  Pendng,
  ConsecutiveAction,
  ConcurrentAction,
  ActionHandler,
  Compute
}

export enum ActionTypes {
  ResolveStateTree = 'pod-action-resolve-state-tree',
  ResolveNext = 'pod-action-resolve-next',
  ResolvePrimitives = 'pod-action-resolve-primitives'
}

export interface InternalActionType {
  type: ActionTypes
}

export interface StateReference {
  state: State
  propertyPath: string
}

export interface Observer {
  type: ObserverType
  fn(...args: any[]): void
}

export enum ObserverType {
  Concurrent,
  Consecutive
}

export interface ObservedStateProperty {
  state: State
  path: string
}

export interface StateCreatorMembers {}

export type ActionResolver<S> = () => S | void

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export type StateProperties<T> = Omit<T, FunctionPropertyNames<T>>
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

export type PodState<T = any> = T & PodStateMethods<T>

export type PodStates<S, M> = PropertyMap<S> &
  FunctionMap<M> &
  PodStateMethods<S>

export type PropertyMap<P> = {
  [K in keyof P]: P[K] extends Function ? never : P[K]
}

export type FunctionMap<P> = {
  [K in keyof P]: P[K] extends Function ? P[K] : never
}

export type PodStateMethods<S = any> = Pick<
  State<S>,
  'reducer' | 'getState' | 'mapState'
>

export type InferStates<A> = {
  [K in keyof A]: A[K] extends PodState<infer T> ? Readonly<T> : unknown
}
