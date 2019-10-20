# Redux Pods

A framework for Redux which makes the creataion of reducers and action creators seamless and easy. The Redux Pods framework manages the often tedious and cumbersome nature in managing the matrix of reducers, action types, action creators and path selectors of a Redux store.

- Pods define all of their actions, arguments and stateful effects in one simple and easy declaration.
- Pod actions are automatically mapped, allowing consumers to call the actions directly without having to manually wrap them with the dispatch function or finagle with complex or nested async. thunks.
- Pods can easily track the actions of other pods, without having to manually coordinate action types, as well as track state changes of other pod reducers.
- Pods automatically detect their location in the Redux state tree, eliminating the need for path selectors or manual path definitions.
- Uses the [Immer](https://github.com/immerjs/immer) library, allowing the effects of Pod actions to make direct mutations to the passed state obj.


## Example

#### Reducer
```TS
import pod from 'redux-pods';

export const count = pod({
  count: 0
}).on({
  setCount: (to: number) => (state) => {
    state.count = to;
  }
});

```

#### Consumer

```JSX
import { connect } from 'react-redux';
import { count } from './reducer';

function Counter(props) {
  return (
    <div>
      <p>You clicked {props.count} times</p>
      <button onClick={() => count.setCount(props.count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default connect(count.mapState)(Component);
```