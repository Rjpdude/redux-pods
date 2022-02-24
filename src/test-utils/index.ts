import { createStore, combineReducers, ReducersMapObject } from 'redux'
import { podsInstance } from '../exports'

export function generateStore<T>(reducers: ReducersMapObject<T>) {
  const store = createStore(combineReducers(reducers))
  podsInstance.registerReduxStore(store)
  return store
}

export function asyncFn<T>(input: T) {
  return new Promise<T>((res) => {
    setTimeout(() => res(input), 1000)
  })
}
