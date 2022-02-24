import { InternalActionType } from './exports'

export class StateTree<S = any> {
  private state: S
  private treeMap: S

  constructor(treeMap: S) {
    this.treeMap = treeMap
  }

  resolveCurrentState(
    action: InternalActionType,
    branch: any = this.treeMap
  ): S {
    if (typeof branch.reducer === 'function') {
      return branch.reducer(branch.getState(), action)
    }

    const obj = Object.entries(branch).reduce(
      (cur, [key, val]) => ({
        ...cur,
        [key]: this.resolveCurrentState(action, val)
      }),
      {}
    ) as S

    if (branch === this.treeMap) {
      this.state = obj
    }
    return obj
  }

  getState() {
    return this.state
  }
}
