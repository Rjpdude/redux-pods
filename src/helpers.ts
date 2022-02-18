import { Store } from 'redux'
import { podsInstance, State, Exposed, InferStates } from './exports'
import { reactError } from './util'

export function register(store: Store) {
  podsInstance.register(store)
}

export function state<S>(initialState: S) {
  const stateObj = new State(initialState)

  function reducer(this: State<S>, state: S, action: any) {
    return this.reducer(state, action)
  }

  const boundReducer = reducer.bind(stateObj) as Exposed<State<S>>

  Object.setPrototypeOf(boundReducer, stateObj)
  Object.defineProperty(boundReducer, 'draft', {
    get() {
      return stateObj.draft
    }
  })

  return boundReducer
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

export function podStateHook<S>(state: State<S>): S {
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
  }, [])

  return podState
}
