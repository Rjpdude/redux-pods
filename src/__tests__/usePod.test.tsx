import * as React from 'react'
import { state, usePod } from '..'
import { generateStore } from '../test-utils'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

describe('usePod react hook', () => {
  it('provides state obj', () => {
    const user = state({ username: 'ryan' })

    const store = generateStore({
      user: user.reducer
    })

    const Component = () => {
      const userState = usePod(user)

      return (
        <div>{userState.username}</div>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find(Component).text()).toBe('ryan')
  })

  it('updates state obj', () => {
    const user = state({ username: 'ryan' })

    const actions = user.actions({
      setUsername: (username: string) => {
        user.draft.username = username
      }
    })

    const store = generateStore({
      user: user.reducer
    })

    const Component = () => {
      const userState = usePod(user)

      return (
        <div>{userState.username}</div>
      )
    }

    const output = mount(
      <Provider store={store}>
        <Component />
      </Provider>
    )

    expect(output.find(Component).text()).toBe('ryan')

    actions.setUsername('bob')

    expect(output.find(Component).text()).toBe('bob')
  })
})
