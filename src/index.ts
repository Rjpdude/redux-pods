import { Pods } from './pods'
import { State } from './state'

export * from './exports'

export function state<S>(initialState: S) {
  return new State(initialState)
}

function reactError() {
  throw new Error('The usePod function requires React 16.8.0 or higher.')
}

export function usePod<S>(state: State<S>): S {
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
