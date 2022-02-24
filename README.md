# Redux Pods

**An integrated framework for the management and composition of Redux state.**

Redux Pods is a powerful state management API that can be integrated with or without Redux. While designed with specific implementations for React and Redux, Pods can be used to manage state within any node based application.

# Example

The following example creates a simple pod state with a `score` property, along with an action handler to add points to the score.

```ts
import { state } from 'redux-pods'

const game = state({ 
  score: 0,

  add: (points: number) => {
    game.score += points
  }
})
```

The following is a simple React counter component that displays the score and a button to increment it.

```tsx
function Counter() {
  const { score } = game.use()

  return (
    <div>
      <p>Score: {score}</p>

      <button onClick={() => game.add(1)}>
        Click me
      </button>
    </div>
  )
}
```

# Setup

At it's core, Redux Pods is a lightweight and versatile state management API that can be used in any node.js application. **No setup is required by default** - states and their corresponding actions can be observed and called from anywhere in your application.

Pod States can be observed using [React Hooks](#hooks) right out of the box, with or without Redux.

## Redux

Pod States expose a `reducer` method which can be included in your redux store right alongside your other reducer functions.

To allow Pod States to function within your Redux store, simply call `register` after your store has been created. The following is an example of a simple redux store using the [game](#example) state from above:

```ts
import { createStore, combineReducers } from 'redux'
import { register } from 'redux-pods'

const store = createStore(
  combineReducers({
    game: game.reducer,
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

# State

To create a pod state, supply an object with the state's initial properties and action handler functions. Here is a more complete example of a game state:

```ts
import { state } from 'redux-pods'

const game = state({
  level: -1,
  countdown: -1,
  score: 0,

  init: (level: number) => {
    game.level = level
  },

  points: (modifier: number) => {
    game.score += modifier
  }
})
```



# Actions

**Pod states can be updated within action handlers, resolve functions and state trackers.**

Changes can be made to a pod state within action callback functions by reference the state object directly. You can use the states `getState` method to reference the current immutable state object anywhere in your callback.

## actionSet

Action handlers can be generated individually through a state's `action` method, or in a set through a state's `actionSet` method. Below is an example of an action set for [game state](#example):

```ts
const gameActions = game.actionSet({
  reduce: (by: number) => {
    game.score -= by
  },

  multiply: (by: number) => {
    game.score *= by
  }
})
```

## resolve

States expose a `resolve` method, allowing dynamic state updates from anywhere in your application. For example, resolvers can be used to effect changes to a state within asynchronous functions.

```ts
const user = state({ 
  username: ''
})

const loadUser = async (key: string) => {
  const userData = await api(key)

  user.resolve(() => {
    user.username = userData.username
  })
}
```

## track

States expose a `track` method to track changes made to another state. When a change is detected, tracker callbacks are called with the tracked state's current and previous value, and can generate updates as a result.

Consider a user state that needs to record every increase to the game state's `score`:

```ts
const user = state({
  total: 0
})

user.track(game, (gameState, prevGameState) => {
  const pointsAdded = gameState.score - prevGameState.score
  
  if (pointsAdded > 0) {
    user.total += pointsAdded
  }
})
```

# State observance

## Observe

**Pod State's expose `observe` to track changes to their state.**

A state observer can be established at any level of your application. The provided callback will resolve with the state's previous value. Observers can be used to enact any kind of side effect - however, they **cannot** be used to directly nor indirectly update their own state.

Consider an API call that needs to be made everytime the game state's `score` property changes:

```ts
game.observe((prevState) => {
  if (game.score !== prevState.score) {
    syncGameScore(game.score)
  }
})
```

Observers are used and established for all internal observance methods. For example, [state trackers](#track) internally create an observer on the tracked state.

## Hooks

**Redux Pods comes pre-bundled with hook functions that can be used out of the box in React components.**


### Example 1

The following example uses the entire user state object:

```tsx
function Component() {
  const userState = user.use()

  return (
    <p>Welcome, {userState.username}!</p>
  )
}
```

### Example 2

The following example uses the specific `username` property of the user state:

```tsx
function Component() {
  const username = user.use('username')

  return (
    <p>Welcome, {username}!</p>
  )
}
```

### Example 3

The following example uses a narrowed object of the user state containing the `id` and `username` properties:

```tsx
function Component() {
  const { id, username } = user.use('id', 'username')

  return (
    <a href={`/profile/${id}`}>{username}</a>
  )
}
```

### usePods

You can also use multiple state values at once with the `usePods` hook:

```tsx
import { usePods } from 'redux-pods'

function Component() {
  const [user, game] = usePods(userState, gameState)

  return (
    <span>{user.username} {game.score}</span>
  )
}
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
