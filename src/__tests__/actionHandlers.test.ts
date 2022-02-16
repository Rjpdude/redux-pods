import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { createStore, combineReducers } from 'redux'
import pods, { state, usePod } from '..'
import { generateStore, asyncFn } from '../test-utils'

describe('v2', () => {
  test('action handlers', () => {
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

  test('state mapping & path detection', () => {
    const game = state({
      score: 0
    })

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          game: game.reducer
        })
      })
    })

    expect(game.getPath()).toBe("deeply.nested.game")
    expect(game.map(store.getState())).toEqual({ score: 0 })
  })

  test('state tracker', () => {
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

  // it('react', async () => {
  //   const user = state({
  //     total: 0
  //   })

  //   const game = state({
  //     score: 0
  //   })

  //   const gameActions = game.actions({
  //     tally: (points: number) => {
  //       game.draft.score += points
  //     }
  //   })

  //   const asyncAction = async (points: number) => {
  //     const res = await asyncDemo(points)

  //     game.resolve((draft) => {
  //       draft.score += res
  //     })
  //   }

  //   const Demo = () => {
  //     const u = usePod(game)
  //     console.log(u)
  //     return <div>{u.score}</div>
  //   }

  //   const store = createStore(combineReducers({
  //     game: game.reducer
  //   }))

  //   pods.register(store)

  //   const output = mount(
  //     <Provider store={store}>
  //       <Demo />
  //     </Provider>
  //   )

  //   await asyncAction(50)

  //   expect(output.find(Demo).text()).toBe("50")
  // })
  // it('async', async () => {
  //   const { store, gameActions } = test()
  //   await gameActions.check(10)
  //   console.log(store.getState())
  // })
  // it('works', () => {
  //   const { store, gameActions } = test()
  //   gameActions.tally(10)
  //   console.log(store.getState())
  // })
  // it('time', () => {
  //   const { store, gameActions } = test()

  //   let cur = Date.now()
  //   gameActions.tally(10)
  //   console.log('tally:', Date.now() - cur)

  //   cur = Date.now()
  //   store.dispatch({ type: 'demo', str: 'hi' })
  //   console.log('demo:', Date.now() - cur)

  //   cur = Date.now()
  //   store.dispatch({ type: 'demo2', str: 'hi' })
  //   console.log('demo2:', Date.now() - cur)

  //   console.log(store.getState())
  // })
})
