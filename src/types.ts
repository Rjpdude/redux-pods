import { Draft } from 'immer'

export type DraftFn<S> = (state: Draft<S>) => Draft<S> | void
export type ActionCreator<S> = (...args: any[]) => S | void

export interface StatefulActionSet<S> {
    [key: string]: ActionCreator<S>
}

export type ActionSet<O extends StatefulActionSet<any>> = {
  [K in keyof O]: (...args: Parameters<O[K]>) => void
}
