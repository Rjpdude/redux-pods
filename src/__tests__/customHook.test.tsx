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
      player,
      game
    })

    function useData() {
      const [username, setUsername] = React.useState(player.current.username)
      const [score, setScore] = React.useState(game.current.score)
    
      React.useEffect(() => {
        const unregisterUser = player.watch(({ username }) => {
          setUsername(username)
        })
    
        const unregisterGame = game.watch(({ score }) => {
          setScore(score)
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

    expect(output.find("#username").text()).toBe('ryan')
    expect(output.find("#score").text()).toBe('10')

    act(() => {
      player.resolve((draft) => {
        draft.username = 'john'
      })
      game.resolve((draft) => {
        draft.score = 50
      })
    })

    expect(output.find("#username").text()).toBe('john')
    expect(output.find("#score").text()).toBe('50')
  })

  it('provides state from custom hook using usePods', () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const store = generateStore({
      player,
      game
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

    expect(output.find("#username").text()).toBe('ryan')
    expect(output.find("#score").text()).toBe('10')

    act(() => {
      player.resolve((draft) => {
        draft.username = 'john'
      })
      game.resolve((draft) => {
        draft.score = 50
      })
    })

    expect(output.find("#username").text()).toBe('john')
    expect(output.find("#score").text()).toBe('50')
  })

  it('unregisters watcher fn when component unmounts', () => {
    const player = state({ username: 'ryan' })

    const store = generateStore({
      player
    })

    const fn = jest.fn()

    function useData() {
      const [username, setUsername] = React.useState(player.current.username)
    
      React.useEffect(() => {
        return player.watch(({ username }) => {
          fn(username)
          setUsername(username)
        })
      }, [])
    
      return username
    }

    const Component = () => {
      const username = useData()

      return (
        <div id="username">{username}</div>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    act(() => {
      player.resolve((draft) => {
        draft.username = 'john'
      })
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'john')

    output.unmount()

    player.resolve((draft) => {
      draft.username = 'mike'
    })

    expect(fn).not.toHaveBeenCalledWith('mike')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
