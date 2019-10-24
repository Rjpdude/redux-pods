# Redux Pods

[![npm](https://img.shields.io/npm/v/redux-pods.svg)](https://www.npmjs.com/package/redux-pods) [![Minzipped size](https://img.shields.io/bundlephobia/minzip/redux-pods@1.0.5.svg)](https://bundlephobia.com/result?p=redux-pods) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

**A framework for Redux which makes the composition and management of reducers and action creators seamless and easy.**

## Motivation

Let's face it. Redux boilerplate *sucks*. 

At any scale, even in small applications but especially in larger ones, the matrix of elements composing a redux store can quickly become unmanageable. Developers find themselves juggling an ungodly number of action types, action creators, reducers, path selectors and mapping functions, which are often entangled across hundreds of different files, workspaces and directories.

**Redux Pods** solves this problem by providing a powerful framework for composing redux reducers and actions all in one place, eliminating the boilerplate, and giving you more time to be the engineer you were born to be.

# Features

- **Easy to Compose** - Pod reducers define all of their actions, arguments and stateful effects in one simple and easy declaration.

- **Easy to Integrate** - Pod reducers are included in your redux store in exactly the same way as any traditional reducer function - making them super easy to drop into any existing application.

- **Auto Binding** - Pod actions are automatically mapped, eliminating the need for manual dispatch mapping, and allowing consumers to access and call them directly.

- **Auto Path Selection** - Pod reducers automatically detect their location in the redux store's object tree, allowing consumers to easily map to the state without manual state mapping.

- **Direct State Mutation** - Redux Pods uses the [Immer](https://github.com/immerjs/immer) library, allowing state updates to make direct mutations to their supplied `state` obj.

- **Tracking** - Pod reducers can easily track and assign state updates to the actions and changes in state of other pod reducers.

## Example

```ts
import pod from 'redux-pods';

export const countPod = pod({ count: 0 })
  .on({
    /**
     * Add to the count.
     */
    add: (toAdd: number) => (state) => {
      state.count += toAdd;
    },

    /**
     * Subtract from the count.
     */
    subtract: (toSubtract: number) => (state) => {
      state.count -= toSubtract;
    }
  });
```

Check out the [calling pod actions](#calling-pod-actions) section below to see how these actions are used in a UI component.

# Setup

#### Install

```
npm install redux-pods
```

or

```
yarn add redux-pods
```

#### Include Enhancer

To allow your pod reducers to function in your redux store, simply include the enhancer in your store's composer:

```ts
import pod from 'redux-pod';

const store = createStore(rootReducer, 
  compose(
    pod.enhancer(),
    applyMiddleware(middleware)
  )
);
```

Your pod reducers can then be included in your `combineReducers` tree in the same exact way as traditional reducer functions:

```ts
import { countPod } from './countPod'

export const rootReducer = combineReducers({
  count: countPod
})
```

# Usage

Pods offer various methods for composing actions and effects, all of which can be chained in any order or even extended from another pod. While basic pod reducers may only declare a handful of simple actions, advanced pod reducers have access to a powerful API for managing any complexity of state:

- [**Actions**](#actions)
- [**Tracking**](#tracking)
- [**State Mapping**](#state-mapping)
- [**Reduce**](#reduce)
- [**Extend**](#extend)

A new pod reducer can be created by simply importing the default `pod` function, and calling it with the initial state that it should assume when your redux store is created.

```ts
import pod from 'redux-pods';
```

Valid state types can be any *primitive*, *object* or *array* - but cannot be or contain a class instance or function. Changes to primitive states must be *returned*, as primitives are immutable by nature.

```ts
const boolPod = pod(true)
  .on({
    toggle: () => (state) => {
      return !state;
    }
  });

const numPod = pod(10)
  .on({
    multiply: (by: number) => (state) => {
      return state * by;
    }
  });
```

# Actions

Pod reducers can declare any number actions through the chainable **`on`** method, with corresponding state updates to apply when the action is called. Pods can also declare state updates for incoming action types from traditional reducers:

```ts
import { SOME_ACTION_TYPE } from '../../actionTypes';

export const countPod = pod({ count: 0 })
  .on({
    add: (toAdd: number) => (state) => {
      state.count += toAdd;
    }
  })
  .on(SOME_ACTION_TYPE, (state, action) => {
    state.count = action.something;
  });
```

Although pods can implement [traditional reducer](#reduce) functions for more fine grained control, you can also apply an effect for multiple action types by supplying an array:

```ts
.on([SOME_ACTION_TYPE, ANOTHER_ACTION_TYPE], (state, action) => {
  if (action.type === SOME_ACTION_TYPE) {
    state.count = action.something;
  } else {
    state.count += action.somethingElse;
  }
});
```

The actions you declare in a pod reducer are automatically mapped with your redux store's [dispatch](https://redux.js.org/api/store#dispatchaction) function when your store is initialized. This allows you to directly call them from anywhere in your application.

### Calling Pod Actions

Here is an example of how a pod reducer's actions can be called in a React UI component using the [counter example](#example) from above:

```tsx
import { connect } from 'react-redux';
import { countPod } from './countPod';

function Example(props) {
  return (
    <div>
      <p>Count: {props.count}</p>
      <button onClick={() => countPod.add(1)}>Add 1</button>
      <button onClick={() => countPod.subtract(1)}>Subtract 1</button>
    </div>
  );
}

export default connect(countPod.mapState)(Example);
```

In this example UI component, the `add` and `subtract` actions of the `countPod` reducer were accessed directly to modify the count state. This eliminates the need to manually map the actions through a `mapDispatchToProps` handler.

Astute developers will also notice the `countPod.mapState` being passed into the connect. This is one of the ways in which UI components can directly map to the state of a pod reducer without having to finagle with manual path selection in a `mapStateToProps` handle. This becomes especially useful if your desired state object is nested, or when it comes time to re-organize the layout of your redux store.

See the [**State Mapping**](#state-mapping) section below for more on that.

# Tracking

One of the most powerful abilities of pod reducers is tracking. Pods can track and assign state updates to the actions and changes in state of another pod through the chainable `track` method.

### **Action Tracking**

Action tracking allows your pod reducers to easily assign state updates to the actions of other pod reducers, much to the same effect as traditional reducers, just without having to manually coordinate the types or shapes of incoming actions.

```ts
import { countPod } from './countPod';

export const userPod = pod({ username: '', totalAdded: 0 })
  .on({
    login: (user: UserObj) => (state) => {
      state.username = user.username;
    }
  })
  .track(countPod.add, (toAdd) => (state) => {
    state.totalAdded += toAdd;
  });
```

In this example, the `userPod` reducer is tracking the `add` action of the `countPod` reducer, and reading the `toAdd` argument supplied when the action is called to add to the user state's `totalAdded` property. Trackers can be chained to track as many actions as you'd like:

```ts
.track(countPod.add, (toAdd) => (state) => {
  state.totalAdded += toAdd;
})
.track(countPod.subtract, (toSubtract) => (state) => {
  state.totalAdded -= toSubtract;
})
```

### **State Tracking**

Pods can also track the changes in state of other pod reducers, and assign a state update to take effect immediately thereafter. In a traditional redux environment, this is generally accomplished by using a UI component to detect changes in state, and manually dispatching an action in response. Redux pods eliminates the middleman:

```ts
import { countPod } from './countPod'

export const userPod = pod({ username: '', highscore: 0 })
  .on({
    ...
  })
  .track(countPod, (countState) => (userState) => {
    if (countState.count > userState.highscore) {
      userState.highscore = countState.count;
    }
  });
```

In this example, the `userPod` reducer implements a tracker to detect any change in the state of the `countPod` reducer. When the countPod's state changes, the tracker checks to see if the `count` is greater than the user's `highscore` and updates accordingly. State trackers also has access to the *previous* state as well, similar to a React component's `componentDidUpdate` method:

```ts
.track(countPod, (countState, previousCountState) => (userState) => {
  ...
})
```

### **Combining Trackers**

Action and state trackers can also be combined, the important distinction being that state trackers take place *after* the references pod's state is updated, while action trackers take place *at the same time* as the referenced action.

```ts
import { countPod } from './countPod'

export const userPod = pod({ username: '', highscore: 0 })
  .on({
    ...
  })
  .track(countPod, (countState, previousCountState) => (userState) => {
    ...
  })
  .track(countPod.add, (toAdd) => (userState) => {
    ...
  })
```

# State Mapping

Pod reducers detect their path in your redux store's object tree when it's initialized - and supplies the `mapState` method for consumers to access it. This is especially useful for reducers who's state objects are deeply nested in your redux store, and eliminates the need for bloated state mapping handlers such as `mapStateToProps`.

Another added benefit is if you ever move the location of your reducers or re-organize your redux store. The biggest hurdle to re-organization of a store or moving the locations of reducers is going through and re-formatting your state mapping functions. Pod reducers, however, can be moved and re-organized within your redux state tree without any real consideration towards state mapping.

The following examples will demonstrate how to map the state from the [user pod example](#state-tracking) from above, in the context of a React component. 

### Examples

Supplying a pod's `mapState` directly to `connect` in place of a traditional `mapStateToProps` handle will automatically map the entire pod's state obj. to the component:

```tsx
import { connect } from 'react-redux';
import { userPod } from './userPod';

function User(props) {
  return (
    <div>
      <p>Welcome, {props.username}!</p>
      <p>Highscore: {props.highscore}</p>
    </div>
  );
}

export default connect(userPod.mapState)(User); // props = { username: '', highscore: 0 }
```

Alternatively, you can also use a pod's `mapState` method directly inside of a `mapStateToProps` handle, which can be useful if you'd only like to map a specific part of your pod's state or to combine multiple pod states:

```tsx
import { countPod } from './countPod';
import { userPod } from './userPod';

function User(props) {
  return (
    <div>
      <p>Welcome, {props.user.username}!</p>
      <p>Highscore: {props.user.highscore}</p>
      <p>Count: {props.currentCount}</p>
    </div>
  );
}

const mapStateToProps = (state) => ({
  user: userPod.mapState(state),
  currentCount: countPod.mapState(state, 'count')
})

export default connect(mapStateToProps)(User);
```

You can define a selection of your pod's mapped state in one of two ways:

#### Function Selector

```ts
const mapStateToProps = (state) => ({
  user: userPod.mapState(state, (user) => ({
    username: user.username,
    anotherUserProp: user.anotherUserProp
  }))
});
```

#### Spread Selector

```ts
const mapStateToProps = (state) => ({
  user: userPod.mapState(state, 'username', 'anotherUserProp')
});
```

#### Both of these will supply the same result:

```ts
props: { user: { username: '', anotherUserProp: '' } }
```

# Reduce

Documentation oming soon...

# Extend

Documentation oming soon...
