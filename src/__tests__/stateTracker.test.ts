import { state } from '..'
import { generateStore } from '../test-utils'

describe('State tracker functions', () => {
  it('tracks state from action handler update', () => {
    const user = state({
      username: '',
      currentScore: -1
    })

    const userActions = user.actions({
      loadUser: (username: string, currentScore: number) => {
        user.draft.username = username
        user.draft.currentScore = currentScore
      }
    })

    const game = state({
      score: -1
    })

    const fn = jest.fn((cur, _prev) => {
      game.draft.score = cur.currentScore
    })

    game.track(user, fn)

    const store = generateStore({ user: user.reducer, game: game.reducer })

    expect(store.getState().user.currentScore).toBe(-1)
    expect(store.getState().game.score).toBe(-1)

    userActions.loadUser('ryan', 500)

    expect(store.getState().user.currentScore).toBe(500)
    expect(store.getState().game.score).toBe(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(
      { username: 'ryan', currentScore: 500 },
      { username: '', currentScore: -1 }
    )
  })

  it('tracks multiple state updates', () => {
    const user = state({
      username: '',
      currentScore: -1
    })

    const userActions = user.actions({
      loadUser: (username: string, currentScore: number) => {
        user.draft.username = username
        user.draft.currentScore = currentScore
      }
    })

    const game = state({
      score: -1
    })

    const fn = jest.fn((cur, _prev) => {
      game.draft.score = cur.currentScore
    })

    game.track(user, fn)

    const store = generateStore({ user: user.reducer, game: game.reducer })

    userActions.loadUser('ryan', 500)
    expect(store.getState().game.score).toBe(500)

    userActions.loadUser('tyler', 35)
    expect(store.getState().game.score).toBe(35)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(
      1,
      { username: 'ryan', currentScore: 500 },
      { username: '', currentScore: -1 }
    )
    expect(fn).toHaveBeenNthCalledWith(
      2,
      { username: 'tyler', currentScore: 35 },
      { username: 'ryan', currentScore: 500 }
    )
  })
})
