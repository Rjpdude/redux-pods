import { state } from '..'
import { generateStore } from '../test-utils'
import { combineReducers } from 'redux'

describe('State paths & state mapping', () => {
  it('detects paths', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    generateStore({
      user: user.reducer,
      game: game.reducer,
    })

    expect(user.getPath()).toBe('user')
    expect(game.getPath()).toBe('game')
  })

  it('maps state', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      user: user.reducer,
      game: game.reducer,
    })

    expect(user.map(store.getState())).toEqual({ username: 'ryan' })
    expect(game.map(store.getState())).toEqual({ score: 0 })
  })

  it('detects deeply nested paths', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          user: user.reducer,
          game: game.reducer,
        })
      })
    })

    expect(user.getPath()).toBe('deeply.nested.user')
    expect(game.getPath()).toBe('deeply.nested.game')
  })

  it('maps state from within a deeply nested reducer', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          user: user.reducer,
          game: game.reducer,
        })
      })
    })

    expect(user.map(store.getState())).toEqual({ username: 'ryan' })
    expect(game.map(store.getState())).toEqual({ score: 0 })
  })

  it('maps state for primitive values', () => {
    const bigintVal = BigInt('1').valueOf()
    const symbolVal = Symbol('str')

    const num = state(10)
    const str = state('hello')
    const bool = state(true)
    const bigint = state(bigintVal)
    const symbol = state(symbolVal)

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          num: num.reducer,
          str: str.reducer,
          bool: bool.reducer,
          bigint: bigint.reducer,
          symbol: symbol.reducer,
        })
      })
    })

    const states = [
      num.map(store.getState()),
      str.map(store.getState()),
      bool.map(store.getState()),
      bigint.map(store.getState()),
      symbol.map(store.getState())
    ]

    expect(states).toEqual([10, 'hello', true, bigintVal, symbolVal])
  })
})
