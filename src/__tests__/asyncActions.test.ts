import { state, apply } from '..'
import { generateStore, asyncFn } from '../test-utils'

describe('State async action handlers', () => {
  it('sets & syncs score from async action handler', async () => {
    const game = state({
      score: 0,

      init: async () => {
        const res = await asyncFn(10)

        apply(() => {
          game.score = res
        })
      }
    })

    const store = generateStore({ game: game.reducer })

    expect(store.getState().game.score).toBe(0)

    await game.init()

    expect(store.getState().game.score).toBe(10)
  })

  it('async function can call internal action handlers', async () => {
    const game = state({
      score: 0,
      timer: -1,

      setScore: (score: number) => {
        game.score = score
      },

      setTimer: (timer: number) => {
        game.timer = timer
      },

      init: async () => {
        const res = await asyncFn({ score: 50, timer: 10 })

        game.setScore(res.score)
        game.setTimer(res.timer)
      }
    })

    const store = generateStore({ game: game.reducer })

    expect(store.getState().game.score).toBe(0)
    expect(store.getState().game.timer).toBe(-1)

    await game.init()

    console.log(game)

    expect(store.getState().game.score).toBe(50)
    expect(store.getState().game.timer).toBe(10)
  })
})
