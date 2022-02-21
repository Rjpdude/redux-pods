import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { state, synchronize, usePods } from '..'
import { generateStore, asyncFn } from '../test-utils'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

describe('usePods and State use react hook', () => {
  it('provides state obj', () => {
    const player = state({ username: 'ryan' })

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

  it.only('updated multiple states', async () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })
    
    const setScore = game.action((to: number) => {
      game.draft.score = to
    })

    const store = generateStore({ player, game })

    // const Component = () => {
    //   const [playerData, gameData] = usePods(player, game)

    //   React.useEffect(() => {
    //     console.log('effect called', playerData.username, gameData.score)
    //   }, [playerData, gameData])

    //   return (
    //     <>
    //       <div id="username">{playerData.username}</div>
    //       <div id="score">{gameData.score}</div>
    //     </>
    //   )
    // }

    const Component = () => {
      const playerData = player.use()

      console.log('component1', playerData)

      return (
        <div>{playerData.username}</div>
      )
    }

    const Component2 = () => {
      const playerData = player.use()
      const gameData = game.use()

      console.log('component2', gameData, playerData)

      return (
        <div>{gameData.score}</div>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
        <Component2 />
      </Provider>
    )

    // expect(output.find('#username').text()).toBe('ryan')
    // expect(output.find('#score').text()).toBe('10')

    // act(() => {
    //   setUsername('jeremy')
    //   setScore(100)
    // })

    await act(async () => {
      // setUsername('jeremy')
      // setScore(100)

      await asyncFn(null)

      synchronize(() => {
        setUsername('john')
        setScore(200)
      })
    })

    // expect(output.find('#username').text()).toBe('john')
    // expect(output.find('#score').text()).toBe('200')
  })
})
