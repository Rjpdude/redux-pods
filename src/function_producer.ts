/**
 * This abstract super class is responsible for producing a bound function through the
 * root function and bound function members defined by the child class. This can be extended
 * by any class which needs to produce a specific function with specific assigned members.
 *
 * Used by the `PodReducer` and `ProxiedAction` classes.
 */
export abstract class FunctionProducer<T, F extends (...args: any) => any> {
  /**
   * The bound function with the assigned members.
   */
  protected boundFunction: F & T

  /**
   * The abstract method defined by the child to supply the function members to assign.
   */
  protected abstract boundFunctionMembers(): T

  /**
   * Class constructor which accepts the origin root function from the child class.
   *
   * @param unboundFunction The origin unbound root function.
   */
  constructor(private unboundFunction: F) {}

  /**
   * Returns the bound function, and if it has yet to be assigned the bound function
   * members, assigns the function members beforehand.
   */
  getBoundFunc() {
    if (!this.boundFunction) {
      this.boundFunction = this.assign(this.unboundFunction)
    }
    return this.boundFunction
  }

  /**
   * A util. function to assign the bound function members supplied by the child class to
   * any other obj. the consumer provides.
   *
   * @param to The obj. to assign the bound function members to.
   */
  assign(to: any) {
    return Object.assign(to, this.boundFunctionMembers())
  }
}
