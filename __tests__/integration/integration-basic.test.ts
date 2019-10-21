import { createStore, combineReducers } from 'redux'
import pod from '../..'

const generateStore = () => {
  const reducers = {
    counter: pod({ count: 0 })
      .on({
        add: (toAdd: number) => (state) => {
          state.count += toAdd
        },
        remove: (toRemove: number) => (state) => {
          state.count -= toRemove
        }
      })
      .on('classic-reducer-action', (state) => {
        state.count = 500
      }),

    classic: (state = { prop: 0 }, action: any) => {
      if (action.type === 'classic-reducer-action') {
        return { ...state, prop: 5 }
      }
      return state
    }
  }

  const store = createStore(combineReducers(reducers), pod.enhancer())

  return {
    ...reducers,
    originalState: store.getState(),
    store
  }
}

describe('[integration] basic app store', () => {
  test('initial store state', () => {
    expect(generateStore().originalState).toEqual({
      counter: { count: 0 },
      classic: { prop: 0 }
    })
  })

  test('store state updated by pod actions', () => {
    const { store, counter } = generateStore()

    counter.add(15)
    counter.remove(5)

    expect(store.getState().counter.count).toBe(10)
  })

  test('pod actions update state without mutating previous state obj', () => {
    const { store, originalState, counter } = generateStore()

    counter.add(10)

    expect(originalState).toEqual({
      counter: { count: 0 },
      classic: { prop: 0 }
    })

    expect(store.getState().classic).toBe(originalState.classic)
    expect(store.getState().counter).not.toBe(originalState.counter)
  })

  test('pod reacts and updates to external classic action', () => {
    const { store } = generateStore()

    store.dispatch({ type: 'classic-reducer-action' })

    expect(store.getState().counter.count).toBe(500)
    expect(store.getState().classic.prop).toBe(5)
  })
})
