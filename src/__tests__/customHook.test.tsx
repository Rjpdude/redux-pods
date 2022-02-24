import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { state, usePods } from '..'
import { generateStore } from '../test-utils'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

describe('Custom hook functions', () => {
  it('provides states from custom hook function', () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const store = generateStore({
      player: player.reducer,
      game: player.reducer
    })

    function useData() {
      const [username, setUsername] = React.useState(player.username)
      const [score, setScore] = React.useState(game.score)

      React.useEffect(() => {
        const unregisterUser = player.observe(() => {
          setUsername(player.username)
        })

        const unregisterGame = game.observe(() => {
          setScore(game.score)
        })

        return () => {
          unregisterUser()
          unregisterGame()
        }
      }, [])

      return { username, score }
    }

    const Component = () => {
      const { username, score } = useData()

      return (
        <>
          <div id="username">{username}</div>
          <div id="score">{score}</div>
        </>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find('#username').text()).toBe('ryan')
    expect(output.find('#score').text()).toBe('10')

    act(() => {
      player.resolve(() => {
        player.username = 'john'
      })
      game.resolve(() => {
        game.score = 50
      })
    })

    expect(output.find('#username').text()).toBe('john')
    expect(output.find('#score').text()).toBe('50')
  })

  it('provides state from custom hook using usePods', () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const store = generateStore({
      player: player.reducer,
      game: game.reducer
    })

    function useData() {
      const [{ username }, { score }] = usePods(player, game)

      return { username, score }
    }

    const Component = () => {
      const { username, score } = useData()

      return (
        <>
          <div id="username">{username}</div>
          <div id="score">{score}</div>
        </>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find('#username').text()).toBe('ryan')
    expect(output.find('#score').text()).toBe('10')

    act(() => {
      player.resolve(() => {
        player.username = 'john'
      })
      game.resolve(() => {
        game.score = 50
      })
    })

    expect(output.find('#username').text()).toBe('john')
    expect(output.find('#score').text()).toBe('50')
  })

  it('unregisters watcher fn when component unmounts', () => {
    const player = state({ username: 'ryan' })

    const store = generateStore({
      player: player.reducer
    })

    const fn = jest.fn()

    function useData() {
      const [username, setUsername] = React.useState(player.username)

      React.useEffect(() => {
        return player.observe(() => {
          fn(player.username)
          setUsername(player.username)
        })
      }, [])

      return username
    }

    const Component = () => {
      const username = useData()

      return <div id="username">{username}</div>
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    act(() => {
      player.resolve(() => {
        player.username = 'john'
      })
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'john')

    output.unmount()

    player.resolve(() => {
      player.username = 'mike'
    })

    expect(fn).not.toHaveBeenCalledWith('mike')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
