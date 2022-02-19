import { state, onTransmit } from '../exports'
import { generateStore } from '../test-utils'

interface UserData {
  username: string
  score?: number
}

describe('Data transmit actions', () => {
  it('resolves transmitted data', () => {
    const transmitUserData = onTransmit<UserData>()

    const userState = state({
      username: ''
    })

    userState.on(transmitUserData, (data, draft) => {
      draft.username = data.username
    })

    const store = generateStore({ 
      user: userState 
    })

    expect(store.getState().user.username).toBe('')

    transmitUserData({
      username: 'ryan'
    })

    expect(store.getState().user.username).toBe('ryan')
  })

  it('resolves transmitted data on multiple states and only resolves once', () => {
    const transmitUserData = onTransmit<UserData>()

    const userState = state({
      username: ''
    })

    const gameData = state({
      score: 0
    })

    const updateUser = jest.fn((data: any, draft: any) => {
      draft.username = data.username
    })

    const updateGame = jest.fn((data: any, draft: any) => {
      draft.score = data.score
    })

    userState.on(transmitUserData, updateUser)
    gameData.on(transmitUserData, updateGame)

    const store = generateStore({ 
      user: userState,
      game: gameData
    })

    expect(store.getState().user.username).toBe('')
    expect(store.getState().game.score).toBe(0)

    transmitUserData({
      username: 'ryan',
      score: 100
    })

    expect(store.getState().user.username).toBe('ryan')
    expect(store.getState().game.score).toBe(100)

    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(updateGame).toHaveBeenCalledTimes(1)
  })

  it('resolves multiple transmitted data calls', () => {
    const transmitUserData = onTransmit<UserData>()

    const userState = state({
      username: ''
    })

    const gameData = state({
      score: 0
    })

    const updateUser = jest.fn((data: any, draft: any) => {
      draft.username = data.username
    })

    const updateGame = jest.fn((data: any, draft: any) => {
      draft.score = data.score
    })

    userState.on(transmitUserData, updateUser)
    gameData.on(transmitUserData, updateGame)

    const store = generateStore({ 
      user: userState,
      game: gameData
    })

    expect(store.getState().user.username).toBe('')
    expect(store.getState().game.score).toBe(0)

    transmitUserData({
      username: 'ryan',
      score: 100
    })

    expect(store.getState().user.username).toBe('ryan')
    expect(store.getState().game.score).toBe(100)

    transmitUserData({
      username: 'john',
      score: 50
    })

    expect(store.getState().user.username).toBe('john')
    expect(store.getState().game.score).toBe(50)

    expect(updateUser).toHaveBeenCalledTimes(2)
    expect(updateGame).toHaveBeenCalledTimes(2)
  })

  it('works with multiple transmitters', () => {
    const transmitUserData = onTransmit<UserData>()
    const transmitScore = onTransmit<number>()

    const userState = state({
      username: ''
    })

    const gameData = state({
      score: 0
    })

    const updateUser = jest.fn((data: any, draft: any) => {
      draft.username = data.username
    })

    const updateGame = jest.fn((data: any, draft: any) => {
      draft.score = data
    })

    userState.on(transmitUserData, updateUser)
    gameData.on(transmitScore, updateGame)

    const store = generateStore({ 
      user: userState,
      game: gameData
    })

    expect(store.getState().user.username).toBe('')
    expect(store.getState().game.score).toBe(0)

    transmitUserData({
      username: 'ryan'
    })

    expect(store.getState().user.username).toBe('ryan')
    expect(updateGame).not.toHaveBeenCalled()

    transmitScore(500)

    expect(store.getState().user.username).toBe('ryan')
    expect(store.getState().game.score).toBe(500)

    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(updateGame).toHaveBeenCalledTimes(1)
  })
})
