import { createStore, combineReducers } from 'redux'
import pod from '../..'

const generateStore = () => {
  const podReducer = pod({ val: 'bla' }).on({
    reset: () => (state) => {
      state.val = ''
    }
  })

  const anotherPodReducer = pod(5).track(podReducer.reset, () => (state) => {
    return state * 10
  })

  const classic = (state = { prop: 0 }, action: any) => {
    return state
  }

  const reducer = combineReducers({
    1: classic,
    2: classic,
    3: combineReducers({
      4: classic,
      5: combineReducers({
        6: podReducer,
        7: classic,
        8: combineReducers({
          9: anotherPodReducer
        })
      })
    })
  })

  const store = createStore(reducer, pod.enhancer())

  return {
    podReducer,
    anotherPodReducer,
    originalState: store.getState(),
    store
  }
}

describe('[integration] nested pod', () => {
  test('pod actions work when nested deep', () => {
    const {
      store,
      podReducer,
      anotherPodReducer,
      originalState
    } = generateStore()

    podReducer.reset()
    expect(podReducer.path()).toBe('3.5.6')
    expect(anotherPodReducer.path()).toBe('3.5.8.9')
    expect(originalState['3']['5']['6'].val).toBe('bla')
    expect(originalState['3']['5']['8']['9']).toBe(5)
    expect(store.getState()['3']['5']['6'].val).toBe('')
    expect(store.getState()['3']['5']['8']['9']).toBe(50)
  })
})
