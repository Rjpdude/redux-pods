import { Store } from 'redux'
import { podsInstance, State, Exposed, InferStates, ExtractStateType } from './exports'
import { mapStateValues, reactError } from './util'

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

  boundReducer.instance = stateObj
  return boundReducer
}

export function synchronize(fn: () => void) {
  podsInstance.synchronizeActionHandlers(fn)
}

export function usePods<A extends any[]>(
  ...args: A
): A extends [infer T]
  ? T extends Exposed<State<infer S>>
    ? Readonly<S>
    : any
  : InferStates<A> {
  return args.length === 1
    ? podStateHook([args[0]])[0]
    : podStateHook(args as Exposed<State<any>>[]) as any
}

export function podStateHook<S extends Exposed<State>[]>(states: S): InferStates<S> {
  let react: any
  try {
    react = require('react')
  } catch (error) {
    reactError()
  }

  if (!react.useState || !react.useEffect) {
    reactError()
  }

  const [podState, setPodState] = react.useState(
    mapStateValues(states)
  )

  react.useEffect(() => {
    return podsInstance.createStateTracker(states.map(({ instance }) => instance), () => {
      setPodState(mapStateValues(states))
    })
  }, [])

  return podState
}
