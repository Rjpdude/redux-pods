import { state } from '..'
import { generateStore } from '../test-utils'

describe('State tests', () => {
  it('throws error when attempting to generate drafts outside resolver function', () => {
    const game = state({ count: 0 })

    expect(() => {
      game.draft.count = 10
    }).toThrowError(
      'State drafts can only be accessed within action creator or resolver functions.'
    )
  })

  it('throws error when attempting to generate drafts inside watcher function', () => {
    const game = state({ count: 0 })

    const gameActions = game.actions({
      setCount: (to: number) => {
        game.draft.count = to
      }
    })

    const store = generateStore({
      game: game.reducer
    })

    game.watch(() => {
      game.draft.count = 50
    })

    const consoleErrorFn = console.error
    console.error = jest.fn()

    gameActions.setCount(100)

    expect(console.error).toHaveBeenCalledWith(
      'Error resolving watcher callback function.',
      new Error(
        'State drafts can only be accessed within action creator or resolver functions.'
      )
    )
    expect(store.getState().game.count).toBe(100)

    console.error = consoleErrorFn
  })

  it('notifies watcher functions', () => {
    const game = state({ count: 0 })

    const gameActions = game.actions({
      setCount: (to: number) => {
        game.draft.count = to
      }
    })

    const store = generateStore({
      game: game.reducer
    })

    const watcherFn1 = jest.fn()
    const watcherFn2 = jest.fn()

    game.watch(watcherFn1)
    game.watch(watcherFn2)

    gameActions.setCount(10)
    expect(store.getState().game.count).toBe(10)

    expect(watcherFn1).toHaveBeenCalledWith({ count: 10 }, { count: 0 })
    expect(watcherFn2).toHaveBeenCalledWith({ count: 10 }, { count: 0 })

    gameActions.setCount(20)
    expect(store.getState().game.count).toBe(20)

    expect(watcherFn1).toHaveBeenCalledWith({ count: 20 }, { count: 10 })
    expect(watcherFn2).toHaveBeenCalledWith({ count: 20 }, { count: 10 })
    expect(watcherFn1).toHaveBeenCalledTimes(2)
    expect(watcherFn2).toHaveBeenCalledTimes(2)
  })

  it('unregisters watcher functions', () => {
    const game = state({ count: 0 })

    const gameActions = game.actions({
      setCount: (to: number) => {
        game.draft.count = to
      }
    })

    const store = generateStore({
      game: game.reducer
    })

    const watcherFn = jest.fn()
    const unregister = game.watch(watcherFn)

    gameActions.setCount(10)
    expect(store.getState().game.count).toBe(10)
    expect(watcherFn).toHaveBeenCalledWith({ count: 10 }, { count: 0 })

    unregister()

    gameActions.setCount(20)
    expect(store.getState().game.count).toBe(20)
    expect(watcherFn).toHaveBeenCalledTimes(1)
  })
})
