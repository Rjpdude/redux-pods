import { state } from '..'
import { generateStore } from '../test-utils'

describe('Reducer time tests', () => {
  test('time difference against normal reducer is less than 10 milliseconds', () => {
    const user = state({ username: '', email: '' })

    const userActions = user.actionSet({
      setUsername: (str: string) => {
        user.draft.username = str
      },
      setEmail: (str: string) => {
        user.draft.email = str
      }
    })

    const simpleReducer = (state = { str: '', num: 0 }, action: any) => {
      if (action.type === 'test1') {
        return { ...state, str: action.str }
      }
      if (action.type === 'test2') {
        return { ...state, num: action.num }
      }
      return state
    }

    const store = generateStore({
      user,
      test: simpleReducer
    })

    let curTime = Date.now()

    store.dispatch({ type: 'test1', str: 'hello' })
    store.dispatch({ type: 'test2', num: 10 })

    const firstTime = Date.now() - curTime

    curTime = Date.now()

    userActions.setUsername('ryan')
    userActions.setEmail('ryan@ryan.com')

    const secondTime = Date.now() - curTime

    // expect the difference in processing pod actions to never exceed more than 9
    // milliseconds more than that of a normal reducer actions
    expect(secondTime - firstTime).toBeLessThan(10)
  })
})
