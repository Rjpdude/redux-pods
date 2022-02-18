import { createStore, combineReducers, Reducer } from 'redux'
import { podsInstance } from '../exports'

export function generateStore<R extends { [key: string]: Reducer }>(
  reducers: R
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
