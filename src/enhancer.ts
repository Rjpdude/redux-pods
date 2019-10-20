import { Dispatch, Store, StoreEnhancer, AnyAction } from 'redux'
import { PodInstance } from './interfaces'
import { PodReducer } from './reducer'
import { INTERNAL_ACTION_TYPES } from './actiontype'
import { PendingValue } from './pending_value'
import { findPath } from './util'
import _ from 'lodash'

export interface ReduxPodEnhancerOptions {
  initializeOn(action: AnyAction): boolean
}

export interface ReduxPodEnhancerContext {
  pathSet: string[]
  trackedPaths: Map<string, any>
}

export interface InternalInitAction<S> extends AnyAction {
  init(initialState: S): S
}

export interface InternalConnectAction<S> extends AnyAction {
  connect(state: S, pod: PodReducer<S, any>): S
}

export interface InternalRegisterTrackerAction extends AnyAction {
  register(trackedPod: PodInstance): void
}

export interface InternalTrackerAction<T> extends AnyAction {
  currentState: T
  previousState: T
  path: string
}

function connectPod<S>(
  enhancerContext: ReduxPodEnhancerContext,
  dispatch: Dispatch<any>,
  storeState: any,
  reducer: PodReducer<S, any>,
  reducerState: S
) {
  const podPath = findPath(storeState, reducerState)

  if (enhancerContext.pathSet.includes(podPath)) {
    console.error(
      `Warning: pod reducer at '${podPath}' has already been connected.`
    )
  } else {
    enhancerContext.pathSet.push(podPath)
  }

  const props = reducer.getProps()
  const reducerFunction = reducer.getBoundFunc()
  const actionSet = props.actionSet

  for (const action of Object.values(actionSet)) {
    reducerFunction[action.getType()] = action.assign((...args: any) => {
      return dispatch(action.getBoundFunc()(...args))
    })
  }

  props.path = podPath
  props.connected = true

  return (reducerState instanceof PendingValue
    ? reducerState.valueOf()
    : reducerState) as S
}

function init(enhancerContext: ReduxPodEnhancerContext, store: Store) {
  store.dispatch<InternalInitAction<any>>({
    type: INTERNAL_ACTION_TYPES.init,
    init: (initialState) => {
      return new PendingValue(initialState)
    }
  })

  const postInitState = store.getState()

  store.dispatch<InternalConnectAction<any>>({
    type: INTERNAL_ACTION_TYPES.connect,
    connect: (reducerState, reducer) => {
      return connectPod(
        enhancerContext,
        store.dispatch,
        postInitState,
        reducer,
        reducerState
      )
    }
  })

  store.dispatch<InternalRegisterTrackerAction>({
    type: INTERNAL_ACTION_TYPES.registerTrackers,
    register: (tracked: PodInstance) => {
      const path = tracked().getProps().path
      if (!enhancerContext.trackedPaths.has(path)) {
        enhancerContext.trackedPaths.set(path, undefined)
      }
    }
  })

  if (enhancerContext.trackedPaths.size) {
    const currentStoreState = store.getState()

    for (const path of enhancerContext.trackedPaths.keys()) {
      enhancerContext.trackedPaths.set(path, _.get(currentStoreState, path))

      store.subscribe(() => {
        const currentState = _.get(store.getState(), path)
        const previousState = enhancerContext.trackedPaths.get(path)

        if (currentState !== previousState) {
          enhancerContext.trackedPaths.set(path, currentState)

          store.dispatch<InternalTrackerAction<any>>({
            type: INTERNAL_ACTION_TYPES.tracker,
            currentState,
            previousState,
            path
          })
        }
      })
    }
  }
}

export function reduxPodEnhancer(
  options: Partial<ReduxPodEnhancerOptions> = {}
): StoreEnhancer {
  const context: ReduxPodEnhancerContext = {
    pathSet: [],
    trackedPaths: new Map()
  }

  return (next) => (...enhancer) => {
    const store = next<any, any>(...enhancer)

    if (!options.initializeOn) {
      init(context, store)
      return store
    }

    return {
      ...store,
      dispatch: (action) => {
        if (options.initializeOn(action)) {
          init(context, store)
        }
        return store.dispatch(action)
      }
    }
  }
}
