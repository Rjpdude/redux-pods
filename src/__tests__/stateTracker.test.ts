import { state } from '..'
import { generateStore } from '../test-utils'

describe('State tracker functions', () => {
  it('tracks state from action handler update', () => {
    const user = state({
      username: '',
      currentScore: -1,
    })

    const userActions = user.actions({
      loadUser: (username: string, currentScore: number) => {
        user.draft.username = username
        user.draft.currentScore = currentScore
      }
    })

    const game = state({
      score: -1,
    })

    game.track(user, (userState) => {
      game.draft.score = userState.currentScore
    })

    const store = generateStore({ user: user.reducer, game: game.reducer })

    expect(store.getState().user.currentScore).toBe(-1)
    expect(store.getState().game.score).toBe(-1)

    userActions.loadUser('ryan', 500)

    expect(store.getState().user.currentScore).toBe(500)
    expect(store.getState().game.score).toBe(500)    
  })
})
