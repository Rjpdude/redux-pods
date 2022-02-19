# Redux Pods

**An integrated framework for the management and composition of Redux state.**

# Example

The following example creates a simple state object with a `score` property, along with an action handler to add points to the score.

```ts
import { state } from 'redux-pods'

const gameState = state({ 
  score: 0
})

const addToScore = gameState.action(
  (points: number) => {
    gameState.draft.score += points
  }
)
```

The following is a simple React counter component that displays the score and a button to increment it.

```tsx
function Counter() {
  const { score } = gameState.use()

  return (
    <div>
      <p>Score: {score}</p>

      <button onClick={() => addToScore(1)}>
        Click me
      </button>
    </div>
  )
}
```

# Setup

Pod states can be included in your store exactly like traditional reducer functions. *It's that easy!*

To initialize the package, simply import and call `register` with your store object after it's been created. This is an example of a simple redux store which includes [gameState](#example) from the example above:

```ts
import { gameState } from './gameState'
import { createStore, combineReducers } from 'redux'
import { register } from 'redux-pods'

const store = createStore(
  combineReducers({
    game: gameState
  })
)

register(store)
```

The store's initial state will look like:

```ts
{
  game: {
    score: 0
  }
}
```

# Actions

**Pod states can be updated using action handlers, resolver functions and state trackers.**

State changes can be effected within action callbacks through the state's `draft` property - a mutable copy of the state object produced by [Immer](https://immerjs.github.io/immer/). After the action callback is fully resolved, the draft is finalized and returned as the new state object.

You can also access the state's `current` property - the actual current state object. This is useful for maintining an awareness of the current state to compare against pending changes on the draft.

## Action handlers

Action handlers can be generated individually through a state's `action` method, or in a set through a state's `actionSet` method. Below is an example of an action set for [gameState](#example):

```ts
const gameActions = gameState.actionSet({
  multiplyScore: (mult: number) => {
    gameState.draft.score *= mult
  },

  resetScore: () => {
    gameState.draft.score = 0
  }
})
```

## Resolve

States expose a `resolve` method, allowing dynamic state updates from anywhere in your application. For example, resolvers can be used to effect changes to a state within asynchronous functions.

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

## Synchronize

State resolvers and action handlers can be synchronized into a single action using the `synchronize` function. The resulting state updates are applied to the redux store and UI concurrently as opposed to sequentially.

This is especially useful for events and asynchronous data that result in updates across multiple states. Consider the following asynchronous function which results in an update to two different states:

```ts
import { synchronize } from 'react-redux'

async function loadUserData() {
  const data = await api()

  synchronize(() => {
    userState.setUsername(data.username)
    gameState.setScore(data.currentScore)
  })
}
```

By synchronizing the two action handler calls, their updated states within the redux store will actualize concurrently.

## Trackers

States expose a `track` method to track changes made to another state. When a change is detected, tracker callbacks are provided the tracked state's current and previous value, and can draft updates as a result.

Consider a user state with a `highscore` property that needs to be updated everytime the game state's `score` property is higher:

```ts
const userState = state({
  highscore: 0
})

userState.track(gameState, ({ score }) => {
  if (score > userState.current.highscore) {
    userState.draft.highscore = score
  }
})
```

# State observance

**Changes to pod states can be observed through React hooks, watchers and custom React hooks.**

Pod states provide internal observance methods which can serve as an alternative to traditional patterns like the `mapStateToProps` and prop comparisons within `componentDidUpdate`.

In many React/Redux applications, reactions to a change in the redux state are generally placed within components. This practice places unnecessary strain on the UI, and also obfuscates separation of concerns.

## Hooks

State's can be used in React components through their internal `use` hook ([see the example above](#example)). You can also use multiple state values at once with the `usePods` hook:

```tsx
import { usePods } from 'redux-pods'

function Component() {
  const [user, game] = usePods(userState, gameState)

  return (
    <span>{user.username} {game.score}</span>
  )
}
```

## Watch

Changes to a state can be observed and acted upon using their internal `watch` method. When a change in state is detected, watcher callbacks are resolved with the state's current and previous value. An `unregister` function is returned as a response to unregister the watcher as necessary.

Consider an API call that needs to be made everytime the game state's `score` property changes.

```ts
gameState.watch((state, prevState) => {
  if (state.score !== prevState.score) {
    syncGameScore(state.score)
  }
})
```

## Custom hooks

You can create custom hooks to supply specific sets of state values. Consider a custom hook that filters a state's list of products by their price:

```tsx
function productsPricedOver(num: number) {
  const state = someState.use()

  const filtered = React.useMemo(() => {
    return state.products.filter(
      (product) => product.price > num
    )
  }, [num, state.products])

  return filtered
}

function Component() {
  const products = productsPricedOver(50)

  return (
    ...
  )
}
```

You can also create custom hooks in conjunction with a state watcher. While this approach is generally unnecessary, if you do need to create one, be sure to unregister the watcher when the component unmounts:

```ts
function useData() {
  ...

  useEffect(() => {
    const unregister = gameState.watch((game) => {

      /** implementation **/

    })

    return () => {
      unregister()
    }
  }, [])

  ...
}
```

## Map

Pod states are aware of their location within the redux state tree. Using their internal `map` method, states can be mapped within functions like `mapStateToProps`.

```ts
function mapStateToProps(storeState) {
  return {
    game: gameState.map(storeState)
  }
}
```

You can also map specific properties of the state value by supplying a function as the second argument:

```ts
function mapStateToProps(storeState) {
  return {
    count: gameState.map(storeState, (game) => game.count)
  }
}
```

# Considerations

The purpose of redux-pods is to modularize redux state objects and combine them with various types of action handlers, hopefully leading to a greater separation of concerns between the data & UI layers of your application. 
There are, however, a few things to take into consideration.

## States

You should also take care to never directly mutate a state's `current` property, or leak/mutate `draft` outside of an action handler. While it is generally safe to access `current` to read a state value, it would be safer to use other methods such as [hooks](#hooks-&-mapping) or [watch](#watch).

## Actions

Action handlers share many of the same best-practice standards as traditional reducer functions. They should be simple in nature - resource intensive computations should be minimised as much as possible.
