import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { createStore, combineReducers } from 'redux'
import pods, { state, usePod } from '../../src'

function asyncDemo(input: number) {
  return new Promise<number>((res) => {
    setTimeout(() => res(input), 1000)
  })
}

describe('v2', () => {
  it('react', async () => {
    const user = state({
      total: 0
    })

    const game = state({
      score: 0
    })

    const gameActions = game.on({
      tally: (points: number) => {
        game.draft.score += points
      }
    })

    user.track(gameActions.tally, (points) => {
      
    })

    const asyncAction = async (points: number) => {
      const res = await asyncDemo(points)

      game.resolve((draft) => {
        draft.score += res
      })
    }

    const Demo = () => {
      const u = usePod(game)
      console.log(u)
      return <div>{u.score}</div>
    }

    const store = createStore(combineReducers({
      game: game.reducer
    }))

    pods.register(store)

    const output = mount(
      <Provider store={store}>
        <Demo />
      </Provider>
    )

    await asyncAction(50)

    expect(output.find(Demo).text()).toBe("50")
  })
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
