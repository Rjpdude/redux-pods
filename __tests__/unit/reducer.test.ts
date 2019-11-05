import pod, {
  PodProperties,
  PodReducer,
  PodMethods,
  ProxiedAction,
  INTERNAL_ACTION_TYPES
} from '../../src'

describe('[unit] reducer class', () => {
  test('instantiates function producer super class', () => {
    expect(typeof new PodReducer({ initialState: '' }).getBoundFunc()).toBe(
      'function'
    )
  })

  test('get props method', () => {
    const props = new PodProperties({ initialState: '' })
    expect(new PodReducer(props).getProps()).toBe(props)
  })

  test('chain method', () => {
    const reducer = new PodReducer({ initialState: 'initial-state' })
    const chainedReducer = reducer.chain({ path: 'an-arbitrary-string' })

    expect(typeof chainedReducer).toBe('function')
    expect(chainedReducer.instance() instanceof PodReducer).toBe(true)
    expect(chainedReducer.props()).toEqual({
      initialState: 'initial-state',
      path: 'an-arbitrary-string'
    })
  })

  test('bound function members method', () => {
    const reducer = new PodReducer({
      initialState: '',
      actionSet: {
        actionOne: new ProxiedAction('actionOne', undefined, jest.fn()),
        actionTwo: new ProxiedAction('actionTwo', undefined, jest.fn())
      }
    })

    const boundFunctionMembersRes = reducer.boundFunctionMembers()
    const keys = Object.keys(boundFunctionMembersRes)

    expect(keys.includes('actionOne') && keys.includes('actionTwo')).toBe(true)

    expect(
      Object.keys(PodMethods.prototype).every((key) => keys.includes(key))
    ).toBe(true)

    expect(
      Object.values(boundFunctionMembersRes).every(
        (val) => typeof val === 'function'
      )
    ).toBe(true)
  })

  describe('produced reducer function', () => {
    test('returns initial state by default', () => {
      const initialState = { elem: '' }
      const reducer = pod(initialState)
      expect(
        reducer(undefined, {
          type: 'external-action'
        })
      ).toBe(initialState)
    })

    test('returns incoming state obj on invalid action', () => {
      const reducer = pod({})
      const state = { elem: '' }

      expect(reducer(state, undefined)).toBe(state)
      // @ts-ignore
      expect(reducer(state, {})).toBe(state)
      // @ts-ignore
      expect(reducer(state, jest.fn())).toBe(state)
      // @ts-ignore
      expect(reducer(state, 'string')).toBe(state)
      // @ts-ignore
      expect(reducer(state, 7)).toBe(state)
    })

    test('responds to internal init action', () => {
      const initAction = {
        type: INTERNAL_ACTION_TYPES.init,
        init: jest.fn()
      }

      const unconnectedReducer = pod({})
      const connectedReducer = pod({})
        .instance()
        .chain({ connected: true })

      connectedReducer(undefined, initAction)
      expect(initAction.init).not.toHaveBeenCalled()
      unconnectedReducer(undefined, initAction)
      expect(initAction.init).toHaveBeenCalled()
    })

    test('responds to internal connect action', () => {
      const connectAction = {
        type: INTERNAL_ACTION_TYPES.connect,
        connect: jest.fn()
      }

      const unconnectedReducer = pod({})
      const connectedReducer = pod({})
        .instance()
        .chain({ connected: true })

      connectedReducer(undefined, connectAction)
      expect(connectAction.connect).not.toHaveBeenCalled()
      unconnectedReducer(undefined, connectAction)
      expect(connectAction.connect).toHaveBeenCalled()
    })

    test('responds to internal register trackers action', () => {
      const registerAction = {
        type: INTERNAL_ACTION_TYPES.registerTrackers,
        register: jest.fn()
      }
      const mockedPod = {}
      const reducer = pod({})

      reducer.props().trackers = new Map().set(mockedPod, '')

      reducer(undefined, registerAction)

      expect(registerAction.register).toHaveBeenCalledWith(mockedPod)
    })

    test('calls actions in proxied action set', () => {
      const actionSet = { action: jest.fn(), secondAction: jest.fn() }
      const reducer = pod({}).on(actionSet)

      reducer.action('arg')
      reducer.secondAction('secondArg')

      expect(actionSet.action).toHaveBeenCalledWith('arg')
      expect(actionSet.secondAction).toHaveBeenCalledWith('secondArg')
    })

    test('does not mutate incoming state', () => {
      const state = { prop: '', anotherProp: { nestedVal: '' } }
      const identicalState = { prop: '', anotherProp: { nestedVal: '' } }

      const reducer = pod(state).on('action-type', (draft) => {
        draft.prop = 'bla'
        draft.anotherProp.nestedVal = 'bla'
      })

      const nextState = reducer(undefined, { type: 'action-type' })

      expect(state).toEqual(identicalState)
      expect(nextState).not.toBe(state)
      expect(nextState).toEqual({
        prop: 'bla',
        anotherProp: { nestedVal: 'bla' }
      })
    })

    describe('primitive states', () => {
      test('boolean', () => {
        const booleanPod = pod(true).on('action-type', () => false)
        expect(booleanPod(undefined, { type: 'action-type' })).toBe(false)
      })

      test('number', () => {
        const numberPod = pod(10).on('action-type', (state) => state * 5)
        expect(numberPod(undefined, { type: 'action-type' })).toBe(50)
      })

      test('string', () => {
        const stringPod = pod('something').on(
          'action-type',
          (state) => `${state} happened`
        )
        expect(stringPod(undefined, { type: 'action-type' })).toBe(
          'something happened'
        )
      })
    })
  })
})
