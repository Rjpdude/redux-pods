// -- Module Exports -- //

export * from './action'
export * from './actionset'
export * from './actiontype'
export * from './effect'
export * from './enhancer'
export * from './tracker'
export * from './function_producer'
export * from './interfaces'
export * from './state'
export * from './methods'
export * from './properties'
export * from './reducer'
export * from './util'

// -- Default function export -- //

import { ChainedPod } from './interfaces'
import { PodReducer } from './reducer'
import { PodProperties } from './properties'
import { reduxPodEnhancer } from './enhancer'

export default function pod<S>(initialState: S): ChainedPod<S, {}> {
  if (initialState === null || typeof initialState === 'function') {
    throw new Error(
      `Invalid initial state of type ${typeof initialState}. Expected object or primitive.`
    )
  }
  return new PodReducer<S, {}>(
    new PodProperties({
      initialState,
      actionSet: {}
    })
  ).getBoundFunc()
}

pod.enhancer = reduxPodEnhancer
