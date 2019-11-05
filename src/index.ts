export * from './internal/module'

import { PodReducer } from './reducer/reducer'
import { PodProperties } from './reducer/properties'
import { ChainedPod, StateResetAction } from './internal/interfaces'
import { reduxPodEnhancer } from './internal/enhancer'

export interface RootPodCreator {
  /**
   * Root pod creator function.
   *
   * @interface S The shape of the pod's reducer state.
   *
   * @param initialState The initial state of the pod reducer.
   */
  <S>(initialState: S): RootPod<S, {}>

  /**
   * Root pod creator function w/ a state reset action key.
   *
   * @interface S The shape of the pod's reducer state.
   *
   * @param initialState The initial state of the pod reducer.
   * @param stateResetActionKey The key of the state reset action.
   */
  <S, A>(initialState: S, stateResetActionKey: keyof A): RootPod<S, A>

  /**
   * Enhancer function to be included in the redux store creation.
   */
  enhancer: typeof reduxPodEnhancer
}

/**
 * An alias type for a `ChainedPod` for applying the statereset action key.
 *
 * @interface S The state shape
 * @interface A The initial action obj. to map
 */
export type RootPod<S, A> = ChainedPod<
  S,
  {
    [ResetKey in keyof A]: StateResetAction
  }
>

/**
 * The root pod creator function overload handler.
 *
 * @param initialState The initial reducer state obj.
 * @param stateResetActionKey The state reset action key.
 */
export const rootPodCreator: RootPodCreator = (
  initialState: any,
  stateResetActionKey?: string
) => {
  if (initialState === null || typeof initialState === 'function') {
    throw new Error(
      `Invalid initial state of type ${typeof initialState}. Expected object or primitive.`
    )
  }

  const suppliedStateResetKey = stateResetActionKey !== undefined

  if (
    suppliedStateResetKey &&
    (typeof stateResetActionKey !== 'string' ||
      stateResetActionKey.length === 0)
  ) {
    throw new Error(
      `Invalid state reset action key of type ${typeof stateResetActionKey}. Expected string.`
    )
  }

  const props = new PodProperties({ initialState, actionSet: {} })
  const pod = new PodReducer<any, any>(props).getBoundFunc()

  return !suppliedStateResetKey
    ? pod
    : pod.on({
        [stateResetActionKey]: () => () => initialState
      })
}

rootPodCreator.enhancer = reduxPodEnhancer

export default rootPodCreator
