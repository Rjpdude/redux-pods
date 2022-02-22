import { Store } from 'redux'
import {
  podsInstance,
  StateTree,
  State,
  Exposed,
  InferStates,
  BranchMapObject
} from './exports'
import { mapStateValues, reactError } from './util'

export function register(store: Store) {
  podsInstance.registerReduxStore(store)
}

export function tree<T>(tree: T) {
  const stateTree = new StateTree(tree)
  podsInstance.registerStateTree(stateTree)
  return stateTree
}

export function branch<B>(branch: BranchMapObject<B>): B {
  return branch as any
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

export function usePods<S extends Exposed<State>[]>(
  ...states: S
): InferStates<S> {
  const react = getReact()

  const [podState, setPodState] = react.useState(() => {
    return mapStateValues(states)
  })

  react.useEffect(() => {
    return podsInstance.createStateTracker(
      states.map(({ instance }) => instance),
      () => {
        setPodState(mapStateValues(states))
      }
    )
  }, [])

  return podState
}

export function getReact() {
  let react: any

  try {
    react = require('react')
  } catch (error) {
    reactError()
  }

  if (!react.useState || !react.useEffect) {
    reactError()
  }

  return react
}
