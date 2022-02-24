import { state, StateProperties, PodState } from '../exports'
import { generateStore } from '../test-utils'

interface Game {
  score: number
}

describe('State action sets', () => {
  it('sets state from action handlers', () => {
    const initialState: Game = {
      score: 0
    }

    const game = state(initialState, {
      add(num: number) {
        game.score += num
      },

      remove(num: number) {
        game.score -= num
      }
    })

    const store = generateStore({ game: game.reducer })

    game.add(10)
    expect(store.getState().game.score).toBe(10)

    game.remove(5)
    expect(store.getState().game.score).toBe(5)
  })

  it('only calls state resolvers once', () => {
    const game = state({
      score: 0,

      setScore: (score: number) => {
        setScore()
        game.score = score
      },
      reset: () => {
        reset()
        game.score = 0
      }
    })

    const setScore = jest.fn()

    const reset = jest.fn()

    const store = generateStore({ game: game.reducer })

    game.setScore(10)
    expect(store.getState().game.score).toBe(10)
    game.reset()
    expect(store.getState().game.score).toBe(0)

    expect(setScore).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
