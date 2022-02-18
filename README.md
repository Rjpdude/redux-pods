# Redux Pods

## Example

The following example creates a simple state object with a `score` property, and two action handlers to `add` and `remove` points.

```ts
import { state } from 'redux-pods'

const gameState = state({ 
  score: 0
})

const gameActions = gameState.actionSet({
  add: (points: number) => {
    gameState.draft.score += points
  },

  remove: (points: number) => {
    gameState.draft.score -= points
  }
})
```

The following is a simple React counter component that displays the score and a button to increment it.

```tsx
function Counter() {
  const { score } = gameState.use()

  return (
    <div>
      <p>Score: {score}</p>

      <button onClick={() => gameActions.add(1)}>
        Click me
      </button>
    </div>
  )
}
```

# Setup

Pod states can be included in your store exactly like traditional reducer functions. *It's that easy!*

To initialize the package, simply import and call `register` with your store object after it's been created.

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

This is an example of a simple redux store which includes [gameState](#example) from the example above. This store's initial state will look like:

```
{
  game: {
    score: 0
  }
}
```

# Action handlers

Pod state's expose an `action` method to produce individual action handlers, and `actionSet` to produce a set of multiple action handlers. Action handlers can accept any number of arguments and have the ability to effect state updates through the state's `draft` property.


Working off the above [gameState example](#example), we can produce an individual multiplier action like so:

```ts
export const multiply = gameState.action(
  (mult: number) => {
    gameState.draft.score *= mult
  }
)
```

The `multiply` function accepts a multiplier argument and updates the `score` accordingly. It can then be imported and called from anywhere in the application.

# Resolve

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

# Trackers

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

To prevent infinite callback loops, trackers can only generate updates to their own state - the tracked state can only be observed, not updated.

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

# Map

Pods are aware of their location within the redux state tree. This is especially helpful for deeply nested states that need to be mapped, for example, within a `mapStateToProps` function.

```ts
function mapStateToProps(storeState) {
  return {
    game: gameState.map(storeState)
  }
}
```

# Watch

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

# Custom hooks

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

# Considerations

The purpose of redux-pods is to modularize redux state objects and combine them with various types of action handlers, hopefully leading to a greater separation of concerns between the data & UI layers of your application. There are, however, a few things to take into consideration.

## States

You should also take care to never directly mutate a state's `current` property, or leak/mutate `draft` outside of an action handler. While it is generally safe to access `current` to read a state value, it would be safer to use other methods such as [hooks](#hooks-&-mapping) or [watch](#watch).

## Actions

Action handlers share many of the same best-practice standards as traditional reducer functions. They should be simple in nature - resource intensive computations should be minimised as much as possible.

