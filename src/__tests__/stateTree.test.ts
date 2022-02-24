import { tree, branch, state } from '..'

/** states */
const user = state({
  id: '',
  username: '',
  email: ''
})

const game = state({
  score: 0
})

const transactions = state({
  pending: [] as string[],
  previous: [] as string[]
})

/** branches */
const global = branch({
  user
})

const session = branch({
  game,
  transactions
})

/** state tree */
const stateTree = tree({
  global,
  session
})

describe('State tree tests', () => {
  it('applies initial state tree', () => {
    expect(stateTree.getState()).toEqual({
      global: {
        user: {
          id: '',
          username: '',
          email: ''
        }
      },
      session: {
        game: {
          score: 0
        },
        transactions: {
          pending: [],
          previous: []
        }
      }
    })
  })

  it('applies updates to state tree from resolver action', () => {
    game.resolve(() => {
      game.score = 10
    })

    expect(stateTree.getState()).toEqual({
      global: {
        user: {
          id: '',
          username: '',
          email: ''
        }
      },
      session: {
        game: {
          score: 10
        },
        transactions: {
          pending: [],
          previous: []
        }
      }
    })
  })
})
