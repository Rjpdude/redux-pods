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
  }
})
```

After `gameState` has been [included as a reducer](#including-state-reducers), it's state and actions can be accessed and called directly.

```tsx
function Component() {
  const { score } = gameState.use()

  return (
    <button onClick={() => gameActions.add(1)}>{score}</button>
  )
}
```

# Setup

To use pods in your application, simply register your redux store through the supplied `register` function.

```ts
import { createStore, combineReducers } from 'redux'
import { register } from 'redux-pods'

const store = createStore(combineReducers({
  ... 
}))

register(store)
```

# Including state reducers

Pod state's are themselves reducer functions, and can be included in your reducer map in exactly the same way as
traditional reducers.

```ts
import { combineReducers } from 'redux'
import { state } from 'redux-pods'

const user = state({
  email: '',
  phoneNumber: ''
})

const game = state({
  score: 0
})

const reducers = combineReducers({
  user,
  game
})
```

# Actions

There are multiple ways to effect a state. States expose a `draft` property - a mutable copy of the actual state object - giving action handler functions the ability to effect changes to a state.

Drafts can be mutated directly without effecting the actual state object itself. Drafts should not be leaked or accessed outside of stateful action handlers.

## Action handlers

A set of action handlers can be created through a state's `actions` method. The action handlers can then be imported and called from anywhere in your application.

```ts
const account = state({
  balance: 0,
  transactions: []
})

const accountActions = account.actions({
  setBalance: (balance: number) => {
    account.draft.balance = balance
  },

  addTransaction: (transaction: Transaction) => {
    account.draft.transactions.push(transaction)
  }
})
```

States also expose a `current` property, allowing access the actual state value. This can be useful for updating the draft while maintaining an awareness of the actual state.

```ts
const accountActions = account.actions({
  setBalance: (balance: number) => {
    account.draft.balance = balance

    if (account.current.balance !== account.draft.balance) {
      ...
    }
  }
})
```

## Resolve

States expose a `resolve` function, allowing dynamic state updates from anywhere in your application. For example, resolvers can be used to effect changes to a state within asynchronous functions.

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

Resolvers can be called from anywhere, not just within async function. For example, it can also be called within a component's internal callback function:

```tsx
import { gameState } from '.'

function Component() {
  const { score } = gameState.use()

  const onClick = () => {
    gameState.resolve((draft) => {
      draft.score += 50
    })
  }

  return <button onClick={onClick}>{score}</button>
}
```

While this sort of approach is generally discouraged in favor of normal action handlers, this pattern can be used for unique corner cases as needed.

## Trackers

States expose a `track` method to track changes to another state and effect changes accordingly

```ts
const userState = state({
  highscore: 0
})

userState.track(gameState, (state, prevState) => {
  if (state.score > prevState.score) {
    userState.draft.highscore = state.score
  }
})
```

The above tracker tracks changes to the `gameState`, and sets the user's highscore when the game state's `count` property is higher than the the previous count.

To prevent infinite callback loops, trackers can only generate updates to their own state - the tracked state can only be overved, not updated.

# Hooks & Mapping

One of the primary features of pods are their ability to supply their state through React hooks. A pod state can be hooked into a React component in one of two ways - individually through a state's `use` method, or with multiple states through the `usePods` function.

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

Pods are aware of their location within the redux state tree. This is especially helpful for deeply nested states that need to be mapped, for example, within a `mapStateToProps` function.

```ts
function mapStateToProps(storeState) {
  return {
    game: gameState.map(storeState)
  }
}
```

## Watch

Similar to hooks, pod states can be observed from anywhere in your application through the state's `watch` method. This can be helpful for generating side effects when a state is updated, for example, calling an API with an updated state property.

```ts
const game = state({
  score: 0
})

game.watch((state, prevState) => {
  if (state.score !== prevState.score) {
    syncGameScore(state.score)
  }
})
```

In a tradition react/redux application, these types of side effects are generally placed within a UI component, often resulting in inconsistent and unreliable outcomes. Extracting side effects into watcher functions can reduce strain on your application's UI layer, and more reliably react to a change in your state.

To prevent infinite callback loops, `watch` can only be used to **observe** state changes. Accessing the state's `draft` or calling a state's action handler within a watch function will result in an error.

## Custom hooks

You can also create your own custom hooks using `watch`. When creating a custom hook, you should always unregister the watcher when the component unmounts using the unregister function returned by `watch`. The state's `current` property can be used to initialize your component's internal state.

```tsx
function useData() {
  const [username, setUsername] = useState(user.current.username)
  const [score, setScore] = useState(game.current.score)

  useEffect(() => {
    const unregisterUser = user.watch(({ username }) => {
      setUsername(username)
    })

    const unregisterGame = game.watch(({ score }) => {
      setScore(score)
    })

    return () => {
      unregisterUser()
      unregisterGame()
    }
  }, [])

  return { username, score }
}
```
