import pod from '../../src'

describe('[unit] state reset action', () => {
  test('invalid key throws error', () => {
    expect(() => pod({}, '')).toThrowError()
    // @ts-ignore
    expect(() => pod({}, 5)).toThrowError()
    // @ts-ignore
    expect(() => pod({}, true)).toThrowError()
    // @ts-ignore
    expect(() => pod({}, null)).toThrowError()
  })

  test('applies action creator', () => {
    expect(pod({}, 'reset')).toHaveProperty('reset')
  })

  test('action creator returns initial state obj', () => {
    const stateObj = {}
    const reducer = pod(stateObj, 'reset')

    expect(
      reducer
        .instance()
        .getProps()
        .actionSet.reset.getActionCreator()()(undefined)
    ).toBe(stateObj)
  })
})
