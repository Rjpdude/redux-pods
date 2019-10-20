import pod, { PodReducer, PodProperties } from '../..'

describe('[unit] index', () => {
  test('supplies default origin pod function', () => {
    expect(typeof pod).toBe('function')
  })

  test('origin pod function instantiates reducer class w/ initial state', () => {
    const newPod = pod({ something: 10 })
    expect(newPod.instance() instanceof PodReducer).toBe(true)
    expect(newPod.props() instanceof PodProperties).toBe(true)
  })

  test('origin pod function supplies enhancer', () => {
    expect(typeof pod.enhancer).toBe('function')
    expect(typeof pod.enhancer()).toBe('function')
  })

  test('origin pod function throws error on invalid state', () => {
    expect(() => pod(null)).toThrowError()
    expect(() => pod(jest.fn())).toThrowError()
  })
})
