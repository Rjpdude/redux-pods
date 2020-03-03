import get from 'lodash.get'

export function mapStateFromPath(
  storeState: any,
  podPath: string,
  subPaths: string[] = []
) {
  const state = get(storeState, podPath, undefined)

  if (state === undefined) {
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
