import { state } from '../exports'
import { generateStore } from '../test-utils'

describe('State action sets', () => {
  it('sets state from action handlers', () => {
    const game = state({
      score: 0
    })

    const actions = game.actionSet({
      setScore: (score: number) => {
        game.draft.score = score
      },
      reset: () => {
        game.draft.score = 0
      }
    })

    const store = generateStore({ game })

    actions.setScore(10)
    expect(store.getState().game.score).toBe(10)
    actions.reset()
    expect(store.getState().game.score).toBe(0)
  })

  it('only calls state resolvers once', () => {
    const game = state({
      score: 0
    })

    const setScore = jest.fn((score: number) => {
      game.draft.score = score
    })

    const reset = jest.fn(() => {
      game.draft.score = 0
    })

    const actions = game.actionSet({
      setScore,
      reset
    })

    const store = generateStore({ game })

    actions.setScore(10)
    expect(store.getState().game.score).toBe(10)
    actions.reset()
    expect(store.getState().game.score).toBe(0)

    expect(setScore).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
