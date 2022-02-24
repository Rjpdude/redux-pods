import { podsInstance } from '../exports'
import { state, track, apply } from '..'
import { asyncFn } from '../test-utils'
import { generateStore } from '../test-utils'

describe('State tracker functions', () => {
  beforeEach(() => {
    podsInstance.reset()
  })

  it('throws error when attempting to track non-state object', () => {
    const user = state({ username: '' })

    expect(() => {
      track({} as any, () => {})
    }).toThrowError(
      'Error attempting to get instance function on pod state object.'
    )
  })

  it('tracks state from action handler update', () => {
    const user = state({
      username: '',
      currentScore: -1,

      loadUser: (username: string, currentScore: number) => {
        user.username = username
        user.currentScore = currentScore
      }
    })

    const game = state({
      score: -1
    })

    const fn = jest.fn()

    track(user, (prev) => {
      fn(prev)
      game.score = user.currentScore
    })

    const store = generateStore({
      user: user.reducer,
      game: game.reducer
    })

    expect(store.getState().user.currentScore).toBe(-1)
    expect(store.getState().game.score).toBe(-1)

    user.loadUser('ryan', 500)

    expect(store.getState().user.currentScore).toBe(500)
    expect(store.getState().game.score).toBe(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ username: '', currentScore: -1 })
  })

  it('tracks multiple state updates', () => {
    const user = state({
      username: '',
      currentScore: -1,

      loadUser: (username: string, currentScore: number) => {
        user.username = username
        user.currentScore = currentScore
      }
    })

    const game = state({
      score: -1
    })

    const fn = jest.fn()

    track(user, (prev) => {
      fn(prev)
      game.score = user.currentScore
    })

    const store = generateStore({
      user: user.reducer,
      game: game.reducer
    })

    user.loadUser('ryan', 500)
    expect(store.getState().game.score).toBe(500)

    expect(fn).toHaveBeenNthCalledWith(1, { username: '', currentScore: -1 })

    user.loadUser('tyler', 35)
    expect(store.getState().game.score).toBe(35)

    expect(fn).toHaveBeenNthCalledWith(2, {
      username: 'ryan',
      currentScore: 500
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('tracks state from async action resolver update', async () => {
    const user = state({
      currentScore: -1,

      async updateUser() {
        const res = await asyncFn(100)

        apply(() => {
          user.currentScore = res
        })
      }
    })

    const game = state({ score: -1 })

    const fn = jest.fn()

    track(user, (prev) => {
      fn(prev)
      game.score = user.currentScore
    })

    const store = generateStore({
      user: user.reducer,
      game: game.reducer
    })

    await user.updateUser()

    expect(store.getState().user.currentScore).toBe(100)
    expect(store.getState().game.score).toBe(100)

    expect(fn).toHaveBeenCalledWith({ currentScore: -1 })
  })
})
