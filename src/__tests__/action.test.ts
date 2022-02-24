import { state } from '../exports'
import { generateStore } from '../test-utils'

describe('State action handler', () => {
  it('sets state from action handlers', () => {
    const game = state({
      score: 0,

      setScore: (to: number) => {
        game.score = to
      },
      reset: () => {
        game.score = 0
      }
    })

    const store = generateStore({ game: game.reducer })

    game.setScore(10)
    expect(store.getState().game.score).toBe(10)

    game.reset()
    expect(store.getState().game.score).toBe(0)
  })

  it('only calls state resolvers once', () => {
    const setScoreSpy = jest.fn()
    const resetSpy = jest.fn()

    const game = state({
      score: 0,

      setScore: (score: number) => {
        setScoreSpy()
        game.score = score
      },
      reset: () => {
        resetSpy()
        game.score = 0
      }
    })

    const store = generateStore({ game: game.reducer })

    game.setScore(10)
    expect(store.getState().game.score).toBe(10)
    game.reset()
    expect(store.getState().game.score).toBe(0)

    expect(setScoreSpy).toHaveBeenCalledTimes(1)
    expect(resetSpy).toHaveBeenCalledTimes(1)
  })
})
