import { Draft } from 'immer'
import { State } from './state'

export type DraftFn<S> = (state: Draft<S>) => Draft<S> | void
export type ActionCreator<S> = (...args: any[]) => S | void

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
  [K in keyof A]: A[K] extends State<infer T> ? T : unknown
}
