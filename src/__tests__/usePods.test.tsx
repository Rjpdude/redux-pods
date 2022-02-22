import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { state, usePods } from '..'
import { generateStore } from '../test-utils'
import { mount } from 'enzyme'

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

    const output = mount(<Component />)

    expect(output.find(Component).text()).toBe('ryan')
  })

  it('updates state obj', () => {
    const player = state({ username: 'ryan' })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })

    generateStore({
      player
    })

    const Component = () => {
      const userState = player.use()

      return <div>{userState.username}</div>
    }

    const output = mount(<Component />)

    expect(output.find(Component).text()).toBe('ryan')

    act(() => {
      setUsername('bob')
    })

    expect(output.find(Component).text()).toBe('bob')
  })

  it('updates state obj without redux', () => {
    const player = state({ username: 'ryan' })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })

    const Component = () => {
      const userState = player.use()

      return <div>{userState.username}</div>
    }

    const output = mount(<Component />)

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

    const output = mount(<Component />)

    expect(spy).toHaveBeenCalledWith({
      username: 'ryan',
      data: { loggedIn: false }
    })

    act(() => {
      player.resolve((draft) => {
        draft.username = 'john'
      })
    })

    expect(spy).toHaveBeenCalledWith({
      username: 'john',
      data: { loggedIn: false }
    })
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

    const output = mount(<Component />)

    expect(output.find('#username').text()).toBe('ryan')
    expect(output.find('#score').text()).toBe('10')
  })

  it('updated multiple states across multiple components', async () => {
    const player = state({ username: 'ryan' })
    const game = state({ score: 10 })

    const setUsername = player.action((to: string) => {
      player.draft.username = to
    })

    const setScore = game.action((to: number) => {
      game.draft.score = to
    })

    const store = generateStore({ player, game })

    const spy1 = jest.fn()
    const spy2 = jest.fn()

    const Component = () => {
      const [playerData, gameData] = usePods(player, game)

      React.useEffect(() => {
        spy1(playerData, gameData)
      }, [playerData, gameData])

      return <div />
    }

    const Component2 = () => {
      const username = player.use('username')
      const score = game.use('score')

      React.useEffect(() => {
        spy2(username, score)
      }, [username, score])

      return <div />
    }

    const output = mount(
      <>
        <Component />
        <Component2 />
      </>
    )

    expect(spy1).toHaveBeenNthCalledWith(1, { username: 'ryan' }, { score: 10 })
    expect(spy2).toHaveBeenNthCalledWith(1, 'ryan', 10)

    act(() => {
      setUsername('jeremy')
      setScore(100)
    })

    expect(spy1).toHaveBeenNthCalledWith(
      2,
      { username: 'jeremy' },
      { score: 100 }
    )
    expect(spy2).toHaveBeenNthCalledWith(2, 'jeremy', 100)

    expect(spy1).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledTimes(2)
  })
})
