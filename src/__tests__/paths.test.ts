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
      user: user.reducer,
      game: game.reducer
    })

    expect((user as any).getInstance().getPath()).toBe('user')
    expect((game as any).getInstance().getPath()).toBe('game')
  })

  it('maps state', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      user: user.reducer,
      game: game.reducer
    })

    expect(user.mapState(store.getState())).toEqual({ username: 'ryan' })
    expect(game.mapState(store.getState())).toEqual({ score: 0 })
  })

  it('detects deeply nested paths', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          user: user.reducer,
          game: game.reducer
        })
      })
    })

    expect((user as any).getInstance().getPath()).toBe('deeply.nested.user')
    expect((game as any).getInstance().getPath()).toBe('deeply.nested.game')
  })

  it('maps state from within a deeply nested reducer', () => {
    const user = state({ username: 'ryan' })
    const game = state({ score: 0 })

    const store = generateStore({
      deeply: combineReducers({
        nested: combineReducers({
          user: user.reducer,
          game: game.reducer
        })
      })
    })

    expect(user.mapState(store.getState())).toEqual({ username: 'ryan' })
    expect(game.mapState(store.getState())).toEqual({ score: 0 })
  })

  it.skip('maps state for primitive values', () => {
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
          symbol: bigint.reducer
        })
      })
    })

    const states = [
      num.mapState(store.getState()),
      str.mapState(store.getState()),
      bool.mapState(store.getState()),
      bigint.mapState(store.getState()),
      symbol.mapState(store.getState())
    ]

    expect(states).toEqual([10, 'hello', true, bigintVal, symbolVal])
  })
})
