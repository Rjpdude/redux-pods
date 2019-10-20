export class PendingValue<T> {
  constructor(private pendingVal: T) {}

  valueOf() {
    return this.pendingVal
  }
}
