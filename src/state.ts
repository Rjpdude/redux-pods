import _ from 'lodash'

export function mapStateFromPath(
  storeState: any,
  podPath: string,
  subPaths: string[] = []
) {
  const state = _.get(storeState, podPath, undefined)

  if (!state) {
    throw new Error(
      `Unable to locate state from path ${podPath}. Your redux store is likely uninitialized or misconfigured.`
    )
  }

  return !subPaths.length
    ? state
    : subPaths.reduce(
        (mappedState, path) => ({
          ...mappedState,
          [path]: state[path]
        }),
        {}
      )
}

export function mapStateFromFunction<S, R>(
  selector: (state: S) => R,
  ...args: Parameters<typeof mapStateFromPath>
) {
  return selector(mapStateFromPath(...args))
}
