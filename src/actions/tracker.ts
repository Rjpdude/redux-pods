import { INTERNAL_ACTION_TYPES } from '../utils/action_type'
import { InternalTrackerAction } from '../internal/enhancer'
import { effect } from './effect'

import {
  ChainedPod,
  ResolvedPodTracker,
  ExposedActionCreator,
  ExposedActionCreatorRes,
  ResolvedActionTracker
} from '../internal/interfaces'

export function podTrackerEffect<S, TState>(
  pod: ChainedPod<TState, any>,
  tracker: ResolvedPodTracker<TState, S>
) {
  return effect<S, InternalTrackerAction<TState>>((state, action) => {
    if (
      action.type === INTERNAL_ACTION_TYPES.tracker &&
      action.path === pod.path()
    ) {
      const res = tracker(action.currentState, action.previousState)
      if (typeof res === 'function') {
        return res(state)
      }
    }
  })
}

export function actionTrackerEffect<S, E extends ExposedActionCreator<any>>(
  podAction: E,
  func: ResolvedActionTracker<E, S>
) {
  return effect<S, ExposedActionCreatorRes<E>>((state, action) => {
    if (podAction.instance().match(action)) {
      const res = func(...action.arguments)
      if (res) {
        return res(state)
      }
    }
  })
}
