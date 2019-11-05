import { AnyAction } from 'redux'

import {
  ActionSet,
  ExplicitlyTypedAction,
  ProxiedActionSet,
  Effect
} from '../internal/interfaces'

export function effect<S, A = AnyAction>(func: Effect<S, A>): Effect<S, A> {
  return func
}

export function actionTypeEffect<S, T>(types: string[], func: Effect<S, T>) {
  const isArrayOfStrings =
    Array.isArray(types) &&
    types.every((key) => {
      return typeof key === 'string'
    })

  if (!isArrayOfStrings) {
    throw new Error(`
      Invalid action types argument of type ${typeof types}; expected an array of strings.
    `)
  }

  return effect<S>((state, action) => {
    if (types.includes(action.type)) {
      return func(state, action as any)
    }
  })
}

export function internalReducerEffect<S, A extends ActionSet>(
  actionSet = {} as ProxiedActionSet<A>,
  func: Effect<S, ExplicitlyTypedAction<keyof A>>
) {
  const proxiedActions = Object.values(actionSet)

  if (proxiedActions.length === 0) {
    throw new Error(
      `There are no actions available to track. Set your action set before creating an internal reducer.`
    )
  }

  return effect<S>((state, action) => {
    const proxiedAction = proxiedActions.find((proxied) => {
      return proxied.match(action)
    })

    if (proxiedAction) {
      return func(state, {
        ...action,
        type: proxiedAction.getType()
      })
    }
  })
}
