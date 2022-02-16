# Redux Pods

[![npm](https://img.shields.io/npm/v/redux-pods.svg)](https://www.npmjs.com/package/redux-pods) [![Minzipped size](https://img.shields.io/bundlephobia/minzip/redux-pods@2.0.0.svg)](https://bundlephobia.com/result?p=redux-pods) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

**A framework for Redux which makes the composition and management of state and actions seamless and easy.**

## Example

```ts
import { state } from 'redux-pods'

const game = state({ 
  score: 0 
})

const gameActions = game.actions({
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

After the `game` state has been included as a reducer, it's state and actions can be used within a React
UI component without the need for `mapStateToProps` or `mapDispatchToProps`:

```tsx
import { usePod } from 'redux-pods'

function Interface() {
  const gameState = usePod(game)

  return (
    <button onClick={() => gameActions.add(1)}>{gameState.score}</button>
  )
}
```

## Async Actions

Async actions can make changes to a state by using the state's `resolve` callback function.

```ts
const user = state({ 
  username: ''
})

const loadUser = async (key: string) => {
  const userData = await loadUserData(key)

  user.resolve((draft) => {
    draft.username = userData.username
  })
}
```
