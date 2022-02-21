import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { state, synchronize, usePods } from '..'
import { generateStore, asyncFn } from '../test-utils'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

describe('usePods and State use react hook', () => {
  it('provides state obj', () => {
    const player = state({
      username: 'ryan'
    })

    const store = generateStore({
      player
    })

    const Component = () => {
      const userState = player.use()

      return <div>{userState.username}</div>
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find(Component).text()).toBe('ryan')
  })

  it('updates state obj', () => {
    const player = state({ username: 'ryan' })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })

    const store = generateStore({
      player
    })

    const Component = () => {
      const userState = player.use()

      return <div>{userState.username}</div>
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find(Component).text()).toBe('ryan')

    act(() => {
      setUsername('bob')
    })

    expect(output.find(Component).text()).toBe('bob')
  })

  it('provides multiple state properties', () => {
    const player = state({ 
      id: 1,
      username: 'ryan',
      data: {
        loggedIn: false
      }
    })

    generateStore({
      player
    })

    const spy = jest.fn()

    const Component = () => {
      const s = player.use('username', 'data')

      React.useEffect(() => {
        spy(s)
      })

      return <div />
    }

    const output = mount(
      <Component />
    )

    expect(spy).toHaveBeenCalledWith({ username: 'ryan', data: { loggedIn: false }})

    act(() => {
      player.resolve((draft) => {
        draft.username = 'john'
      })
    })

    expect(spy).toHaveBeenCalledWith({ username: 'john', data: { loggedIn: false }})
    expect(spy).toHaveBeenCalledTimes(2)

    act(() => {
      player.resolve((draft) => {
        draft.id = 5
        draft.data.loggedIn = false
      })
    })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('provides multiple states', () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const store = generateStore({
      player,
      game
    })

    const Component = () => {
      const [playerData, gameData] = usePods(player, game)

      return (
        <>
          <div id="username">{playerData.username}</div>
          <div id="score">{gameData.score}</div>
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
  })

  it('updated multiple states', async () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })

    const setScore = game.action((to: number) => {
      game.draft.score = to
    })

    const store = generateStore({ player, game })

    const Component = () => {
      const [playerData, gameData] = usePods(player, game)

      React.useEffect(() => {
        console.log('effect 1', playerData.username, gameData.score)
      }, [playerData, gameData])

      return (
        <>
          <div id="username">{playerData.username}</div>
          <div id="score">{gameData.score}</div>
        </>
      )
    }

    const Component2 = () => {
      const playerData = player.use()
      const gameData = game.use()

      React.useEffect(() => {
        console.log('effect 2', playerData.username, gameData.score)
      }, [playerData, gameData])

      return <div>{gameData.score}</div>
    }

    const output = mount(
      <Provider store={store}>
        <Component />
        <Component2 />
      </Provider>
    )

    // expect(output.find('#username').text()).toBe('ryan')
    // expect(output.find('#score').text()).toBe('10')

    act(() => {
      setUsername('jeremy')
      setScore(100)
    })

    // await act(async () => {
    //   // setUsername('jeremy')
    //   // setScore(100)

    //   await asyncFn(null)

    //   //synchronize(() => {
    //     setUsername('john')
    //     setScore(200)
    //   //})
    // })

    // expect(output.find('#username').text()).toBe('john')
    // expect(output.find('#score').text()).toBe('200')
  })
})
