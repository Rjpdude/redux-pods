import { AnyAction } from 'redux'
import { FunctionProducer } from '../utils/function_producer'
import * as actionTypes from '../utils/action_type'
import {
  PodInstance,
  ActionCreator,
  InternalProxiedAction,
  ProxiedActionMembers
} from '../internal/interfaces'

export class ProxiedAction<A extends ActionCreator> extends FunctionProducer<
  ProxiedActionMembers<A>,
  InternalProxiedAction<A>
> {
  constructor(
    private type: string,
    private instance: PodInstance,
    private actionCreator: A
  ) {
    super((...args: any) =>
      typeof actionCreator(...args) === 'function'
        ? this.proxiedStatefulAction(args)
        : this.proxiedBasicAction(args)
    )
  }

  getType() {
    return this.type
  }

  getActionCreator() {
    return this.actionCreator
  }

  getBaseAction() {
    return {
      type: actionTypes.getActionKey(this.type),
      path: this.instance().getProps().path,
    }
  }

  proxiedStatefulAction(args: any) {
    return {
      ...this.getBaseAction(),
      arguments: args
    }
  }

  proxiedBasicAction(args: any) {
    return {
      ...this.actionCreator(...args),
      ...this.getBaseAction(),
    }
  }

  process(state: any, action: ReturnType<InternalProxiedAction<A>>) {
    if (action.arguments) {
      const res = this.actionCreator(...action.arguments)
      if (typeof res === 'function') {
        return res(state)
      }
    }
  }

  match(action: AnyAction) {
    return (
      actionTypes.isActionOf(this.instance().getProps().path, action) &&
      actionTypes.getReversedActionKey(action.type) === this.type
    )
  }

  clone(instance: PodInstance) {
    return new ProxiedAction(this.type, instance, this.actionCreator)
  }

  boundFunctionMembers(): ProxiedActionMembers<A> {
    return {
      instance: () => this
    }
  }
}
