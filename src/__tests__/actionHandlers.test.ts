import { state } from '..'
import { generateStore } from '../test-utils'

describe('State action handlers', () => {
  it('sets state from action handlers', () => {
    const game = state({
      score: 0
    })

    const actions = game.actions({
      setScore: (score: number) => {
        game.draft.score = score
      },
      reset: () => {
        game.draft.score = 0
      }
    })

    const store = generateStore({ game: game.reducer })

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

    const actions = game.actions({
      setScore,
      reset,
    })

    const store = generateStore({ game: game.reducer })

    actions.setScore(10)
    expect(store.getState().game.score).toBe(10)
    actions.reset()
    expect(store.getState().game.score).toBe(0)

    expect(setScore).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
