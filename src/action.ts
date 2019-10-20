import * as actionTypes from './actiontype'

import { AnyAction } from 'redux'
import { FunctionProducer } from './function_producer'

import {
  PodInstance,
  ActionCreator,
  InternalProxiedAction,
  ProxiedActionMembers
} from './interfaces'

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

  proxiedStatefulAction(args: any) {
    return {
      type: actionTypes.getActionKey(this.type),
      arguments: args
    }
  }

  proxiedBasicAction(args: any) {
    return {
      ...this.actionCreator(...args),
      type: actionTypes.getActionKey(this.type)
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

  boundFunctionMembers(): ProxiedActionMembers<A> {
    return {
      instance: () => this
    }
  }
}
