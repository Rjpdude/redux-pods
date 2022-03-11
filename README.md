# Redux Pods

## Example

The following example instantiates a simple counter state, along with a React component which implements it.

```tsx
import { state, use } from 'redux-pods'

const counter = state({ 
  count: 0,

  increment(by) {
    this.count += by
  }
})

function Component() {
  const count = use(counter.count)

  return (
    <div>
      <p>Count: {count}</p>

      <button onClick={() => counter.increment(1)}>
        Click me
      </button>
    </div>
  )
}
```

# State

State objects and their corresponding properties, computation and action handlers are instantiated in one simple, unified declaration. **No boilerplate, wrappers, mappers or configuration necessary.** It's that easy.

## Properties

```ts
const position = state({
  x: -1,
  y: -1
})
```

State properties should be **pure** and **predictible**. They can be primitives, arrays, sets, maps or objects with any nested asortment thereof. Assignments and updates to any state property, nested at any level, will produce a fresh immutible copy with the corresponding changes.

## Action Handlers

```ts
const data = state({
  elems: [
    { w: 100, h: 100 },
    { w: 100, h: 20 },
  ],

  addBlock(w, h) {
    this.elems.push({ w, h })
  },

  addSqare(size) {
    this.addBlock(size, size)
  }
})
```

Action handlers are defined as method functions that are contextually bound to the most recent copy of the state. Changes made within action creators are assigned to a draft copy which reconciles through an internal reducer function.

## Computed

The above `data` state can be extended with a computed `squares` property using the get syntax:

```ts
const data = state({
  elems: [
    { w: 50, h: 50 },
    { w: 100, h: 300 },
    { w: 100, h: 100 },
  ],

  get squares() {
    return this.elems.filter(({ w, h }) => w === h)
  }
})
```

The `squares` property will compute on initialization, and every subsequent change to `elems`.

```ts
{
  elems: [
    { w: 50, h: 50 },
    { w: 100, h: 300 },
    { w: 100, h: 100 },
  ],

  squares: [
    { w: 50, h: 50 },
    { w: 100, h: 100 },
  ]
}
```

# React

State objects can be used in React components directly. No configuration or higher ordered providers are necessary. Simply import and call the `use` hook with any combination of state objects or individual state properties.

The following is a component that accesses two specific properties from two different state objects in one line:

```tsx
import { use } from 'redux-pods'
import { player, game } from './states'

function Component() {
  const [username, score] = use(player.username, game.score)

  return (
    <div>
      <p>Hello {username}. Your score is {score}.</p>
    </div>
  )
}
```

An entire state object can also be accessed just as easily:

```tsx
import { game } from './states'

function Component() {
  const gameState = use(game)

  return (
    <div>
      <p>Current level: {gameState.level}</p>
      <p>Score: {gameState.score}</p>
    </div>
  )
}
```

## Action Handlers

Action handlers from any state object can be called directly from anywhere in your UI. Consider an individual controller component with no stateful dependencies:

```tsx
import { game } from './states'

function Controller {
  return (
    <div>
      <button onClick={() => game.jump()}>Jump</button>
      <button onClick={() => game.bounce()}>Bounce</button>
    </div>
  )
}
```

