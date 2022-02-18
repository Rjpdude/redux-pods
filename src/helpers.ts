import { State } from './state'
import { reactError } from './util'
import { Exposed, InferStates } from '.'

export function state<S>(initialState: S): Exposed<State<S>> {
  return new State(initialState)
}

export function usePods<A extends any[]>(
  ...args: A
): A extends [infer T]
  ? T extends Exposed<State<infer S>>
    ? Readonly<S>
    : any
  : InferStates<A> {
  return args.length === 1
    ? podStateHook(args[0] as State<any>)
    : args.map(podStateHook)
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
    return state.watch((curState) => {
      setPodState(curState)
    })
  })

  return podState
}
