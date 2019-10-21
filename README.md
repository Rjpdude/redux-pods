# Redux Pods

A framework for Redux which makes the creataion and management of reducers and action creators seamless and easy.

## Motivation

At any scale, even in small applications but especially in larger ones, the matrix of elements composing a redux store can quickly become unmanageable. Teams & developers find themselves juggling an ungodly number of action types, action creators and reducers, which are often times scattered across hundreds of different files, workspaces and directories.

Coordinating all of these elements for consumption adds another layer of complexity as well. Path selectors for mapping state objects plus state/action mapping functions themselves can quickly add up to thousands of lines of code, even in well organized applications.

**Redux Pods** looks to solve this altogether by allowing reducers to declare actions and stateful effects all in one place.

## Features

- **Seamless Declarations** - Pod reducers define all of their actions, arguments and stateful effects in one simple and easy declaration.

- **Auto Binding** - Pod reducer actions are automatically mapped, eliminating the need to manually wrap them in the store's dispatch function.

- **Auto Path Selection** - Pod reducers automatically detect their location in the redux store's object tree, allowing consumers to map to the state without creating manual path selectors.

- **Tracking** - Easily detect/track incoming actions and changes in state of other pod reducers.

- **Extendable** - Much like a class, pods can extend another pod, inheriting and optionally extending it's actions and properties.

- **Direct State Mutation** - Uses the [Immer](https://github.com/immerjs/immer) library, allowing stateful effects to make direct mutations to their supplied `state` obj.

- **Easy Integration** - Pod reducers can be used and included in exactly the same way as any traditional reducer function - making it super easy to drop into an existing application.

## Example

#### Reducer

```TS
import pod from 'redux-pods';

export const countPod = pod({ count: 0 }).on({
  setCount: (to: number) => (state) => {
    state.count = to;
  }
});

```

#### Consumer

```JSX
import { connect } from 'react-redux';
import { countPod } from './reducer';

function Counter(props) {
  return (
    <div>
      <p>You clicked {props.count} times</p>
      <button onClick={() => countPod.setCount(props.count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default connect(countPod.mapState)(Counter);
```

# Setup

#### Install

```
npm install redux-pods
```

or

```
yarn add redux-pods
```

#### Include Enhancer Examples

To allow your pod reducers to function in your redux store, simply include the enhancer in your store creation step:

```ts
import { createStore, compose, applyMiddleware } from 'redux';
import pod from 'redux-pod';

const store = createStore(
  rootReducer, 
  compose(
    applyMiddleware(middleware),
    devTools(),
    pod.enhancer()
  )
);
```

# Usage

Your pod reducers can be included in your redux store's `combineReducers` tree in the same exact way as traditional reducer functions. If you have an existing application, you can simply drop in any pod you create.

```ts
import { countPod } from './countPod'

export default combineReducers({
  count: countPod
})
```

## Actions

Pod reducers can declare any number actions with corresponding stateful effects to apply to the state when the action is called. Pods can also declare a stateful effect for incoming action types from traditional reducers:

```ts
export const counter = pod({ count: 0 })
  .on({
    add: (toAdd: number) => (state) => {
      state.count += toAdd;
    },
    remove: (toRemove: number) => (state) => {
      state.count -= toRemove;
    }
  })
  .on('classic-action-type', (state) => {
    state.count = 0;
  })
  .on(['classic-action-type', 'or-another-action-type'], (state) => {
    state.count += 10;
  });
```

## Reduce

You can also use a traditional reducer type function either for internal actions or external actions. Chained reducer effects are executed in the order they are declared and subsequent to internal actions.

```ts
export const counter = pod({ count: 0 })
  .on({ 
    ... 
  })
  .reduce((state, action) => {
    if (action.type === 'add' && state.count > 100) {
      state.count = 100;
    }
  })
  .reduceAny((state, action) => {
    switch (action.type) {
      case 'some-external-action-type':
        state.count = 0;
        break;
    }
  })
```

## Tracking

Pods can track either the specific actions of other pods, or the changes in state of other pods.

```ts
import { counter } from './counter'

const user = pod({ username: '', totalAdded: 0, highscore: 0 })
  .on({
    login: (username) => (state) => {
      state.username = username; 
      state.totalAdded = 0;
      state.highscore = 0;
    }
  })
  .track(counter, (counterState) => (state) => {
    if (counterState.count > state.highscore) {
      state.highscore = counterState.count;
    }
  })
  .track(counter.add, (toAdd) => (state) => {
    state.totalAdded += toAdd;
  })
```
