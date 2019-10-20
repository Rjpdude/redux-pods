import { ProxiedAction } from './action'
import { ActionSet, PodInstance, ProxiedActionSet } from './interfaces'

export function chainedActionSet<
  OwnActionSet extends ActionSet<any>,
  ChainedActionSet extends ActionSet
>(
  instance: PodInstance,
  existingActionSet = {} as ProxiedActionSet<OwnActionSet>,
  actionSetToChain: ChainedActionSet
) {
  const keys = Object.keys(existingActionSet)

  if (Object.keys(actionSetToChain).some((key) => keys.includes(key))) {
    throw new Error(
      `One of more of the action keys provided have already been defined.`
    )
  }

  return Object.keys(actionSetToChain).reduce(
    (actions, key) => ({
      ...actions,
      [key]: new ProxiedAction(key, instance, actionSetToChain[key])
    }),
    existingActionSet as ProxiedActionSet<OwnActionSet & ChainedActionSet>
  )
}
