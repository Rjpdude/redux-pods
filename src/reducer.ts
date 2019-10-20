import produce from 'immer'

import { Reducer as ReduxReducer, AnyAction } from 'redux'
import { ChainedPod, ActionSet, ExposedActionSet } from './interfaces'
import { INTERNAL_ACTION_TYPES } from './actiontype'
import { FunctionProducer } from './function_producer'
import { PodMethods } from './methods'
import { PodProperties } from './properties'
import { mergeEffects } from './util'

/**
 * The root pod reducer class as a `FunctionProducer`. The main purpose of this class is
 * to initialize the root reducer function as a handle for incoming internal actions and to
 * propagate the incoming state/action objects through the stateful effect chain.
 *
 * It's also responsible for binding the root reducer function with the external methods
 * provided by the `PodMethods` class, along with the proxied action creators chained onto
 * the pod.
 *
 * Used by the root `pod` function to instantiate new pod instances.
 */
export class PodReducer<S, A extends ActionSet<S>> extends FunctionProducer<
  ExposedActionSet<A> & PodMethods<S, A>,
  ReduxReducer<S>
> {
  /**
   * Pod reducer class constructor providing the root reducer function to the
   * function producer super class.
   *
   * @param props The initial or chained `PodProperties` object.
   */
  constructor(private props: PodProperties<any, any>) {
    super((state = props.initialState, action) =>
      typeof action !== 'object' || !action.type
        ? state
        : this.handleAction(state, action)
    )
  }

  /**
   * The first action handler method for all incoming actions. Checks for internal
   * actions, a match on any of the proxied actions and otherwise propagates a drafted
   * state obj. and the incoming action through the stateful effect chain.
   *
   * @param state The incoming state obj. from the redux store.
   * @param action The incoming action obj.
   */
  handleAction(state: S, action: AnyAction) {
    switch (action.type) {
      case INTERNAL_ACTION_TYPES.init:
        return !this.props.connected ? action.init(state) : state

      case INTERNAL_ACTION_TYPES.connect:
        return !this.props.connected ? action.connect(state, this) : state

      case INTERNAL_ACTION_TYPES.registerTrackers:
        if (this.props.trackers) {
          for (const pod of this.props.trackers.keys()) {
            action.register(pod)
          }
        }
        return state
    }

    return produce(state, (draft) => {
      for (const proxiedAction of Object.values(this.props.actionSet)) {
        if (proxiedAction.match(action)) {
          return proxiedAction.process(draft, action)
        }
      }
      return this.props.effectChain
        ? this.props.effectChain(draft, action)
        : draft
    })
  }

  /**
   * Retreives the `PodProperties` obj. corresponding to the pod reducer.
   */
  getProps(): PodProperties<S, A> {
    return this.props
  }

  /**
   * Chains the reducer with a new reducer instance with an updated set of properties.
   *
   * @param propsToMerge A partial property obj. to merge into the chained instance.
   */
  chain<ChainedState, ChainedActionSet extends ActionSet<ChainedState>>(
    propsToMerge: Partial<PodProperties<any, any>> = {}
  ): ChainedPod<ChainedState, ChainedActionSet> {
    if (propsToMerge.effectChain) {
      propsToMerge.effectChain = mergeEffects(
        this.props.effectChain,
        propsToMerge.effectChain
      )
    }
    return new PodReducer<ChainedState, ChainedActionSet>(
      new PodProperties({
        ...this.props,
        ...propsToMerge
      })
    ).getBoundFunc()
  }

  /**
   * Provies an obj. of bound `PodMethods` members along with external proxied action
   * handlers to the super `FunctionProducer` class, which is then applied directly
   * to the root reducer funuction.
   */
  boundFunctionMembers() {
    const methods = new PodMethods<S, A>(this)
    const boundFunctions = {}

    Object.keys(PodMethods.prototype).forEach((key) => {
      boundFunctions[key] = (...args: any) =>
        methods[key].call(methods, ...args)
    })

    if (this.props.actionSet) {
      for (const action of Object.values(this.props.actionSet).values()) {
        boundFunctions[action.getType()] = action.getBoundFunc()
      }
    }

    return boundFunctions as ExposedActionSet<A> & PodMethods<S, A>
  }
}
