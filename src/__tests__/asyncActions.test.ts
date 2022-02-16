import { state } from '..'
import { generateStore, asyncFn } from '../test-utils'

describe('State async action handlers', () => {
  it('sets state from async action handler', async () => {
    const game = state({
      score: 0
    })

    const setScore = async (to: number) => {
      const res = await asyncFn(to)

      game.resolve((draft) => {
        draft.score = res
      })
    }

    const store = generateStore({ game: game.reducer })

    expect(store.getState().game.score).toBe(0)

    await setScore(10)

    expect(store.getState().game.score).toBe(10)
  })
})