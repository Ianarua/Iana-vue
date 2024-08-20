import { describe, expect } from 'vitest';
import { effect, reactive } from '@iana-vue/reactivity';

describe('reactive', () => {
  it('测试reactive正常返回响应式对象', () => {
    const origin = {
      foo: 1,
      bar: {
        baz: 2,
      },
    };
    const observed = reactive(origin);

    // 检查属性
    expect(observed).not.toBe(origin);
    expect(observed.foo).toBe(1);
  });

  it('测试reactive触发副作用函数', () => {
    const origin = reactive({ num: 1 });
    let cnt = 0;
    const renderSpy = vi.fn(() => (cnt = origin.num));
    // 收集依赖函数
    effect(renderSpy);
    expect(cnt).toBe(1);
    // 修改响应式数据，看看源数据有没有改(测试副作用函数是否执行)
    origin.num = 2;
    expect(cnt).toBe(2);
  });
});