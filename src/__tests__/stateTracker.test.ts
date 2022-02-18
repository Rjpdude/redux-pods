import { state } from '..'
import { generateStore, asyncFn } from '../test-utils'

describe('State tracker functions', () => {
  it('throws error when attempting to track non-state object', () => {
    const user = state({ username: '' })

    expect(() => {
      user.track({} as any, (_a, _b) => {})
    }).toThrowError('Trackers must reference a different state object.')
  })

  it('throws error when attempting to track own state', () => {
    const user = state({ username: '' })

    expect(() => {
      user.track(user, (_a, _b) => {})
    }).toThrowError('Trackers must reference a different state object.')
  })

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

    const store = generateStore({ user, game })

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

  it.only('tracks multiple state updates', () => {
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

    const store = generateStore({ user, game })

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

  it('tracks state from async action resolver update', async () => {
    const user = state({ currentScore: -1 })
    const game = state({ score: -1 })

    const fn = jest.fn((cur, _prev) => {
      game.draft.score = cur.currentScore
    })
    game.track(user, fn)

    const updateUser = async () => {
      const res = await asyncFn(100)

      user.resolve((draft) => {
        draft.currentScore = res
      })
    }

    const store = generateStore({ user, game })

    await updateUser()

    expect(store.getState().user.currentScore).toBe(100)
    expect(store.getState().game.score).toBe(100)
    expect(fn).toHaveBeenCalledWith({ currentScore: 100 }, { currentScore: -1 })
  })
})
