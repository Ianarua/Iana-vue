import { computed, reactive } from '@iana-vue/reactivity';
import { expect } from 'vitest';

describe('computed', () => {
  it('computed的响应式', () => {
    const value = reactive({
      foo: 1,
    });

    const foo = computed(() => {
      return value.foo;
    });
    expect(foo.value).toBe(1);

    value.foo = 2;
    expect(foo.value).toBe(2);
  });

  it('computed的缓存', () => {
    const value = reactive({
      foo: 1
    })
    const getter = vi.fn(() => value.foo);
    const foo = computed(getter);

    // lazy, 初始化不会被调用, 访问才会调
    expect(getter).not.toHaveBeenCalled();

    // 访问, 看看是否调用1次
    expect(foo.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1);

    // 缓存, 不变的情况下再访问不会调用getter
    foo.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // lazy, 就算依赖的数据改变, 不访问还是不会调用getter
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // 现在访问, 会再调getter
    expect(foo.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  })
});