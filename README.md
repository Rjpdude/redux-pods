# Redux Pods

[![npm](https://img.shields.io/npm/v/redux-pods.svg)](https://www.npmjs.com/package/redux-pods) [![Minzipped size](https://img.shields.io/bundlephobia/minzip/redux-pods@2.0.0.svg)](https://bundlephobia.com/result?p=redux-pods) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

**A framework for Redux which makes the composition and management of state and actions seamless and easy.**

## Example

```ts
import { state } from 'redux-pods'

const gameState = state({ 
  score: 0
})

const gameActions = gameState.actions({
  add: (points: number) => {
    game.draft.score += points
  },

  subtract: (points: number) => {
    game.draft.score -= points
  },

  clear: () => {
    game.draft.score = 0
  }
})
```

After `gameState` has been included as a reducer, it's state and actions can be used within a React
UI component without the need for `mapStateToProps` or `mapDispatchToProps`:

```tsx
function Component() {
  const { score } = gameState.use()

  return (
    <button onClick={() => gameActions.add(1)}>{score}</button>
  )
}
```

# State Hooks & Mapping

There are multiple avenues available for accessing a pod state.

## React Hooks

One of the primary features of pods are their ability to supply their state through React hooks. A pod state can be hooked
into a React component in one of two ways - individually through a state's `use` method (as domonstrated above), or with
multiple pod states:

```tsx
import { usePods } from 'redux-pods'

function Component() {
  const [user, game] = usePods(userState, gameState)

  return (
    <span>{user.username} {game.score}</span>
  )
}
```

## Map

Pods are aware of their location within the redux state tree. This is especially helpful for deeply nested states that need
to be mapped, for example, within a `mapStateToProps` function:

```ts
function mapStateToProps(storeState) {
  return {
    game: gameState.map(storeState)
  }
}
```

# Actions

Pod states can be updated in a multitude of ways - action handlers, async functions and trackers. The state's `draft` property -
a mutable copy of the actual state object - is made available within action handlers. Drafts can be mutated in any way without
effecting the actual state object itself.

**Note** state `draft` properties can only be accessed and updated within action handlers. Attemps to access the `draft` property
outside action handlers will result in an error.

## Async Actions

Async actions can make changes to a state by using the state's `resolve` callback function.

```ts
const userState = state({ 
  username: ''
})

const loadUser = async (key: string) => {
  const userData = await loadUserData(key)

  userState.resolve((draft) => {
    draft.username = userData.username
  })
}
```

A state's `resolve` method can be called from anywhere, not just within async function. For example, it can also be called within
a component's internal callback function:

```tsx
import { gameState, gameActions } from '.'

function Component() {
  const { score } = gameState.use()

  const onClick = () => {
    gameActions.resolve((draft) => {
      draft.score += 50
    })
  }

  return <button onClick={onClick}>{score}</button>
}
```

The above component will increase the game state's `score` property by 50 everytime the button is clicked.

## Trackers

Pod states can track changes to other pod states through their `track` method:

```ts
const userState = state({
  highscore: 0
})

userState.track(gameState, (gameState, prevGameState) => {
  if (gameState.score > prevGameState.score) {
    userState.draft.highscore = gameState.score
  }
})
```

The above tracker tracks changes to the `gameState`, and sets the user's highscore when the game state's
`count` property is higher than the the previous count.

Note that trackers can only update their own state - the tracked state can only be read, not updated.
