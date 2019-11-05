/**
 * A class used to hold a pending obj value. Used by the pod enhancer function
 * to temporarily wrap the initial state of pod reducers when the store is being
 * created, and subsequently detect it's location within the redux state tree.
 * 
 * @interface T The pending obj type
 */
export class PendingValue<T> {
  /**
   * Pending Value constructor function.
   * 
   * @param pendingVal The pending value to hold of type `T`
   */
  constructor(private pendingVal: T) {}

  /**
   * Get the original obj. passed to the constructor.
   */
  valueOf() {
    return this.pendingVal
  }
}
