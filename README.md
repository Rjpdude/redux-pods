# Redux Pods

## Example

The following example instantiates a simple counter state, along with a React component which implements it.

```tsx
import { state, use } from 'redux-pods'

const counterState = state({ 
  count: 0,

  increment(by) {
    this.count += by
  }
})

function Component() {
  const count = use(counterState.count)

  return (
    <div>
      <p>Count: {count}</p>

      <button onClick={() => counterState.increment(1)}>
        Click me
      </button>
    </div>
  )
}
```

# States

State objects are built on a powerful yet simple API based on the core principles of **pure, functional programming**. They can be used out of the box in React components and (optionally) Redux stores, or extended for any other context.

Immutable properties, computations and action handlers are instantiated in a simple, unified declaration. **No boilerplate, wrappers, mappers or configuration necessary.**