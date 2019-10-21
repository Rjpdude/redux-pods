import { createStore, combineReducers } from 'redux'
import pod from '../..'

const generateStore = () => {
  const pod1 = pod({
    val: ''
  }).on({
    setVal: (to: string) => (state) => {
      state.val = to
    },
    resetVal: () => (state) => {
      state.val = ''
    }
  })

  const pod2 = pod({
    mimeVal: 'unknown',
    previousVal: 'unknown'
  })
    .on({
      reset: () => (state) => {
        state.mimeVal = ''
      }
    })
    .track(pod1, (current, previous) => (state) => {
      state.mimeVal = current.val
      state.previousVal = previous.val
    })

  const pod3 = pod({
    nestedMimeVal: 'unknown',
    nestedPreviousVal: 'unknown'
  }).track(pod2, (current, previous) => (state) => {
    state.nestedMimeVal = current.mimeVal
    state.nestedPreviousVal = previous.previousVal
  })

  const store = createStore(
    combineReducers({ pod1, pod2, layer: combineReducers({ pod3 }) }),
    pod.enhancer()
  )

  return {
    originalState: store.getState(),
    store,
    pod1,
    pod2
  }
}

describe('[integration] tracking', () => {
  test('pod updated by tracked pod state updates', () => {
    const { store, pod1 } = generateStore()

    pod1.setVal('first-new-val')

    expect(store.getState()).toEqual({
      pod1: { val: 'first-new-val' },
      pod2: { mimeVal: 'first-new-val', previousVal: '' },
      layer: {
        pod3: { nestedMimeVal: 'first-new-val', nestedPreviousVal: 'unknown' }
      }
    })

    pod1.setVal('second-new-val')

    expect(store.getState()).toEqual({
      pod1: { val: 'second-new-val' },
      pod2: {
        mimeVal: 'second-new-val',
        previousVal: 'first-new-val'
      },
      layer: {
        pod3: { nestedMimeVal: 'second-new-val', nestedPreviousVal: '' }
      }
    })
  })
})
