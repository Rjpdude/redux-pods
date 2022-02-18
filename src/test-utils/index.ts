import { createStore, combineReducers, Reducer, ReducersMapObject } from 'redux'
import { podsInstance } from '../exports'

export function generateStore(
  reducers: ReducersMapObject
) {
  const store = createStore(combineReducers(reducers))
  podsInstance.register(store)
  return store
}

export function asyncFn<T>(input: T) {
  return new Promise<T>((res) => {
    setTimeout(() => res(input), 1000)
  })
}
