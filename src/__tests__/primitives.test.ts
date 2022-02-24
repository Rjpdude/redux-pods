import { state } from '..'
import { generateStore } from '../test-utils'

describe('Primitive state types', () => {
  it.only('sets initial primitive state values', () => {
    const num = state(10)
    const str = state('hello')

    const store = generateStore({
      num: num.reducer,
      str: str.reducer
    })

    expect(store.getState().num).toBe(10)
    expect(store.getState().str).toBe('hello')
  })

  // it('updates primitive state values', () => {
  //   const num = state(10)

  //   const actions = num.actionSet({
  //     set: (to: number) => {
  //       return to
  //     },
  //     deduct: (by: number) => {
  //       return num.current - by
  //     }
  //   })

  //   const store = generateStore({
  //     num: num
  //   })

  //   actions.set(50)
  //   expect(store.getState().num).toBe(50)

  //   actions.deduct(10)
  //   expect(store.getState().num).toBe(40)
  // })

  // it.skip('throws error when attempting to draft primitive state val', () => {
  //   const num = state(10)

  //   const actions = num.actionSet({
  //     deduct: (by: number) => {
  //       return num.draft - by
  //     }
  //   })

  //   const store = generateStore({
  //     num
  //   })

  //   const consoleErrorFn = console.error
  //   console.error = jest.fn()

  //   actions.deduct(5)
  //   expect(console.error).toHaveBeenCalledWith(
  //     'Error resolving pod state action handler.',
  //     new Error(
  //       `Primitive state values cannot be drafted - consider using 'current' instead.`
  //     )
  //   )
  //   expect(store.getState().num).toBe(10)

  //   console.error = consoleErrorFn
  // })
})
