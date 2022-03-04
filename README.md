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

State objects are built on a powerful yet simple API based on the core principles of **pure functional programming**. They can be used out of the box in React components and (optionally) Redux stores, or extended for any other context.

Immutable properties, computations and action handlers are instantiated in one simple, unified declaration. **No boilerplate, wrappers, mappers or configuration necessary.**

## Properties

```ts
const position = state({
  x: -1,
  y: -1
})
```

State properties should be **pure** and **predictible**. They can be primitives, arrays, sets, maps or objects with nested properties thereof. Assignments and updates to any state property, nested at any level, will produce a fresh immutible copy with the corresponding changes.

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
    this.setBlock(size, size)
  }
})
```

Action handlers are defined as method functions that are contextually bound to the most recent copy of the state. Changes made within action creators are assigned to a draft copy which reconciles through an internal reducer function.

## Computed

The above `data` state can be extended with a computed `squares` property using a generator function syntax:

```ts
const data = state({
  elems: [
    { w: 50, h: 50 },
    { w: 100, h: 300 },
    { w: 100, h: 100 },
  ],

  *squares() {
    return this.elems.filter(({ w, h }) => w === h)
  }
})
```

The state will compute a subset of elements that are applied to a `squares` property anytime a change is made to the `elems` array property. The resulting state object will resolve as:

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
