import { state, observe } from '../helpers'

describe('compute resolution', () => {
  it('computes from simple number property', () => {
    const computeFnSpy = jest.fn()
    const computeResSpy = jest.fn()

    const data = state({
      num: -5,

      *abs() {
        computeFnSpy()
        return Math.abs(this.num)
      },

      set(to: number) {
        this.num = to
      }
    })

    observe(data.abs, (abs) => {
      computeResSpy(abs)
    })

    expect(data.getState().abs).toBe(5)
    expect(computeFnSpy).toHaveBeenCalledTimes(1)

    data.set(-10)

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
    expect(computeResSpy).toHaveBeenNthCalledWith(1, 10)
  })

  it('computes from simple string property', () => {
    const computeFnSpy = jest.fn()
    const computeResSpy = jest.fn()

    const data = state({
      str: 'john',

      *reversed() {
        computeFnSpy()
        return this.str.length < 2
          ? this.str
          : this.str
              .split('')
              .reverse()
              .join('')
      },

      set(to: string) {
        this.str = to
      }
    })

    observe(data.reversed, (reversed) => {
      computeResSpy(reversed)
    })

    expect(data.getState().reversed).toBe('nhoj')
    expect(computeFnSpy).toHaveBeenCalledTimes(1)

    data.set('cow')

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
    expect(computeResSpy).toHaveBeenNthCalledWith(1, 'woc')
  })

  it('computes from deeply nested property', () => {
    const data = state({
      deeply: {
        nested: {
          set: new Set<number>()
        }
      },

      *sum() {
        return Array.from(this.deeply.nested.set).reduce((a, b) => a + b, 0)
      },

      add(num: number) {
        this.deeply.nested.set.add(num)
      }
    })

    const spy = jest.fn()

    observe(data.sum, (sum) => {
      spy(sum)
    })

    data.add(10)
    data.add(20)
    data.add(50)
    data.add(100)

    expect(spy).toHaveBeenNthCalledWith(1, 10)
    expect(spy).toHaveBeenNthCalledWith(2, 30)
    expect(spy).toHaveBeenNthCalledWith(3, 80)
    expect(spy).toHaveBeenNthCalledWith(4, 180)
  })

  it('computes updates to arr property', () => {
    interface Product {
      id: number
      inStock: boolean
    }

    const inventory = state({
      products: [] as Product[],

      *available() {
        return this.products.filter(({ inStock }) => inStock)
      },

      *unavailable() {
        return this.products.filter(({ inStock }) => !inStock)
      },

      loadProducts() {
        this.products = [
          { id: 1, inStock: true },
          { id: 2, inStock: false },
          { id: 3, inStock: true },
          { id: 4, inStock: true }
        ]
      }
    })

    const spy = jest.fn()

    observe(inventory.available, (products) => {
      spy(products)
    })
    observe(inventory.unavailable, (products) => {
      spy(products)
    })

    inventory.loadProducts()

    expect(spy).toHaveBeenNthCalledWith(1, [
      { id: 1, inStock: true },
      { id: 3, inStock: true },
      { id: 4, inStock: true }
    ])
    expect(spy).toHaveBeenNthCalledWith(2, [{ id: 2, inStock: false }])
  })

  it('does not recompute on irrelevent property updates', () => {
    const computeFnSpy = jest.fn()
    const computeResSpy = jest.fn()

    const user = state({
      id: -1,
      username: '',

      *reversed() {
        computeFnSpy()
        return this.username === ''
          ? ''
          : this.username
              .split('')
              .reverse()
              .join('')
      },

      setId(to: number) {
        this.id = to
      },

      setUsername(to: string) {
        this.username = to
      }
    })

    observe(user.reversed, (reversed) => {
      computeResSpy(reversed)
    })

    expect(computeFnSpy).toHaveBeenCalledTimes(1)

    user.setUsername('ryan')

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenNthCalledWith(1, 'nayr')

    user.setId(10)

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
  })
})

describe('compute yeilds', () => {
  it('yields to a single narrowed property', () => {
    const computeFnSpy = jest.fn()
    const computeResSpy = jest.fn()

    const position = state({
      x: -1,
      y: -1,

      *z() {
        yield this.x

        computeFnSpy()

        return this.x * this.y
      },

      setX(x: number) {
        this.x = x
      },

      setY(y: number) {
        this.y = y
      }
    })

    observe(position.z, (z) => {
      computeResSpy(z)
    })

    expect(position.getState().z).toBe(1)
    expect(computeFnSpy).toHaveBeenCalledTimes(1)

    position.setY(3)

    expect(computeFnSpy).toHaveBeenCalledTimes(1)
    expect(computeResSpy).toHaveBeenCalledTimes(0)

    position.setX(2)

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
    expect(computeResSpy).toHaveBeenNthCalledWith(1, 6)

    position.setY(2)

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
  })

  it('yeilds to multiple narrowed properties', () => {
    const computeFnSpy = jest.fn()
    const computeResSpy = jest.fn()

    const data = state({
      a: 1,
      b: 1,
      c: 1,

      *sum() {
        yield this.a | this.b

        computeFnSpy()

        return this.a + this.b + this.c
      },

      set(key: 'a' | 'b' | 'c', val: number) {
        this[key] = val
      }
    })

    observe(data.sum, (sum) => {
      computeResSpy(sum)
    })

    expect(data.getState().sum).toBe(3)
    expect(computeFnSpy).toHaveBeenCalledTimes(1)

    data.set('a', 2)

    expect(computeFnSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenCalledTimes(1)
    expect(computeResSpy).toHaveBeenNthCalledWith(1, 4)

    data.set('b', 2)

    expect(computeFnSpy).toHaveBeenCalledTimes(3)
    expect(computeResSpy).toHaveBeenCalledTimes(2)
    expect(computeResSpy).toHaveBeenNthCalledWith(2, 5)

    data.set('c', 2)

    expect(computeFnSpy).toHaveBeenCalledTimes(3)
    expect(computeResSpy).toHaveBeenCalledTimes(2)

    expect(data.getState().sum).toBe(5)
  })
})

describe('compute declaration errors', () => {
  const invalidComputeResError =
    'Computes cannot return undefined or static values on instantiation.'

  it('throws error when compute fn returns undefined', () => {
    expect(() => {
      state({
        val: -1,

        *abs() {}
      })
    }).toThrowError(invalidComputeResError)

    expect(() => {
      state({
        val: -1,

        *abs() {
          return undefined
        }
      })
    }).toThrowError(invalidComputeResError)
  })

  it('throws error when compute fn returns undefined after yield', () => {
    expect(() => {
      state({
        a: 0,
        b: 0,

        *sum() {
          yield this.a
        }
      })
    }).toThrowError(invalidComputeResError)

    expect(() => {
      state({
        a: 0,
        b: 0,

        *sum() {
          yield this.a

          return undefined
        }
      })
    }).toThrowError(invalidComputeResError)
  })

  it('throws error when yeild doesnt reference narrowed state properties', () => {
    expect(() => {
      state({
        val: -1,

        *abs() {
          yield

          return Math.abs(this.val)
        }
      })
    }).toThrowError(
      'Yield within state computes must reference atleast one property to narrow computation. Ex: `yeild this.prop`'
    )
  })

  it('throws error when compute fn yields more than once', () => {
    expect(() => {
      state({
        a: 0,
        b: 0,

        *sum() {
          yield this.a

          yield

          return this.a + this.b
        }
      })
    }).toThrowError('Computes can only yield once to narrowed properties.')
  })
})
