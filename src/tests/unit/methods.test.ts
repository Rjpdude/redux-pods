import { PodReducer, PodMethods, PodProperties } from '../../'

function createMethodsInstance(
  props: PodProperties<any, any> = { initialState: '' }
) {
  return new PodMethods(new PodReducer<typeof props['initialState'], {}>(props))
}

describe('[unit] methods class', () => {
  describe('map state', () => {
    const initialState = {
      prop: 'something',
      other: 'another',
      another: 'third'
    }
    const mockState = { first: initialState }

    test('maps entire state', () => {
      expect(
        createMethodsInstance({ initialState, path: 'first' }).mapState(
          mockState
        )
      ).toBe(initialState)
    })

    test('maps partial state when supplied array of strings', () => {
      const instance = createMethodsInstance({ initialState, path: 'first' })
      expect(instance.mapState(mockState, 'prop')).toEqual({
        prop: 'something'
      })
      expect(instance.mapState(mockState, 'prop', 'another')).toEqual({
        prop: 'something',
        another: 'third'
      })
    })

    test('maps mutated state object when supplied function', () => {
      expect(
        createMethodsInstance({ initialState, path: 'first' }).mapState(
          mockState,
          (state) => {
            return [state.prop, state.other, state.another].join('.')
          }
        )
      ).toBe('something.another.third')
    })
  })

  describe('extend', () => {
    test('object state type', () => {
      const instance = createMethodsInstance({
        initialState: { someVal: 'first' }
      })

      const extended = instance.extend({
        anotherVal: 'second'
      })

      expect(extended.props().initialState).toEqual({
        someVal: 'first',
        anotherVal: 'second'
      })
    })
  })
})
