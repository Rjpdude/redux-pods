import { AnyAction } from 'redux'

import {
  PodInstance,
  ActionSet,
  ProxiedActionSet,
  ResolvedPodTracker,
  Effect
} from '../internal/interfaces'

/**
 * The `PodProperties` class contains all of the central properties for each pod
 * along with all of the chained properties such as action creators and effects.
 *
 * An instance of this class is created when initially calling the root `pod` function
 * and subsequently copied & extended when chaining the pod through reducer methods.
 */
export class PodProperties<S, A extends ActionSet<S>> {
  /**
   * The initial state to initialize the root reducer with.
   */
  initialState: S
  /**
   * Whether the proxied action set on the root reducer have been connected.
   */
  connected?: boolean
  /**
   * The path to the state obj. within the redux store state obj.
   */
  path?: string
  /**
   * The consolidated list of chained action creators.
   */
  actionSet?: ProxiedActionSet<A>
  /**
   * A singlar merged function of the chained stateul effects applied to the pod.
   */
  effectChain?: Effect<S, AnyAction>
  /**
   * A map obj. of pod instances to track and coinciding tracking effects.
   */
  trackers?: Map<PodInstance, ResolvedPodTracker<any, S>>

  /**
   * Pod properties class constructor accepts a partial properties object and applies
   * the obj. members to itself.
   *
   * @param properties Partial properties object.
   */
  constructor(properties: Partial<PodProperties<S, A>>) {
    Object.assign(this, properties)
  }
}
