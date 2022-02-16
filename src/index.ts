import { Pods } from './pods'
import { State } from './state'
import { reactError } from './util'

export * from './exports'

export function state<S>(initialState: S) {
  return new State(initialState)
}

type InferStates<A> = {
  [K in keyof A]: A[K] extends State<infer T> ? T : unknown
}

export function usePods<S extends Array<State<any>>>(...args: S): 
  S extends [State<infer T>] 
    ? T 
    : InferStates<S> 
{
  return args.length === 1 
    ? podStateHook(args[0]) 
    : args.map(podStateHook) as any
}

function podStateHook<S>(state: State<S>): S {
  let react: any
  try {
    react = require('react')
  } catch (error) {
    reactError()
  }
  
  if (!react.useState || !react.useEffect) {
    reactError()
  }

  const [podState, setPodState] = react.useState(state.current)

  react.useEffect(() => {
    state.registerHook(setPodState)

    return () => {
      state.unregisterHook(setPodState)
    }
  })

  return podState
}

export default new Pods()
