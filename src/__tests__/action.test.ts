import { state } from '../exports'
import { generateStore } from '../test-utils'

describe('State action handler', () => {
  it('sets state from action handlers', () => {
    const game = state({
      score: 0
    })

    const setScore = game.action((to: number) => {
      game.draft.score = to
    })

    const reset = game.action(() => {
      game.draft.score = 0
    })

    const store = generateStore({ game })

    setScore(10)
    expect(store.getState().game.score).toBe(10)

    reset()
    expect(store.getState().game.score).toBe(0)
  })

  it('only calls state resolvers once', () => {
    const game = state({
      score: 0
    })

    const setScoreMock = jest.fn((score: number) => {
      game.draft.score = score
    })

    const resetMock = jest.fn(() => {
      game.draft.score = 0
    })

    const setScore = game.action(setScoreMock)
    const reset = game.action(resetMock)

    const store = generateStore({ game })

    setScore(10)
    expect(store.getState().game.score).toBe(10)
    reset()
    expect(store.getState().game.score).toBe(0)

    expect(setScoreMock).toHaveBeenCalledTimes(1)
    expect(resetMock).toHaveBeenCalledTimes(1)
  })
})
