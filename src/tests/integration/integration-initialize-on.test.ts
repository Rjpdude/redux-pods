import { createStore, combineReducers } from 'redux'
import pod from '../..'

const generateStore = (initializeOn: (action: any) => boolean) => {
  const reducers = {
    mockPod: pod({ val: '' }).on({
      action: () => (state) => {
        state.val = 'set'
      }
    })
  }

  const store = createStore(
    combineReducers(reducers),
    pod.enhancer({
      initializeOn
    })
  )

  return {
    ...reducers,
    originalState: store.getState(),
    store
  }
}

describe('[integration] initialize on', () => {
  test('initializes on custom action', () => {
    const { store, originalState, mockPod } = generateStore((action) => {
      return action.type === 'an-action-type'
    })

    mockPod.action()

    expect(mockPod.props().connected).toBeFalsy()
    expect(store.getState()).toBe(originalState)

    store.dispatch({ type: 'an-action-type' })
    expect(mockPod.props().connected).toBe(true)

    mockPod.action()
    expect(store.getState()).toEqual({
      mockPod: { val: 'set' }
    })
  })
})
