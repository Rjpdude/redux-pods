import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { state, usePods } from '..'
import { generateStore } from '../test-utils'
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

    const actions = player.actions({
      setUsername: (username: string) => {
        player.draft.username = username
      }
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
      actions.setUsername('bob')
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
})
