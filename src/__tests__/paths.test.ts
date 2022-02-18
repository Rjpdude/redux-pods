import { state } from '../exports'
import { generateStore } from '../test-utils'
import { combineReducers } from 'redux'

describe('State paths & state mapping', () => {
  it('throws error when state is initialized with null or undefined', () => {
    expect(() => {
      state(null)
    }).toThrowError(
      'Pod states should cannot be initialized with null or undefined.'
    )

    expect(() => {
      state(undefined)
    }).toThrowError(
      'Pod states should cannot be initialized with null or undefined.'
    )
  })

  it('detects paths', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    generateStore({
      user,
      game
    })

    expect(user.getPath()).toBe('user')
    expect(game.getPath()).toBe('game')
  })

  it('maps state', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      user,
      game
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
          user,
          game
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
          user,
          game
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
          num,
          str,
          bool,
          bigint,
          symbol
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
