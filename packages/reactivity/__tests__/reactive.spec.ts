import { describe, expect } from 'vitest';
import { effect, isReactive, reactive } from '@iana-vue/reactivity';

describe('reactive', () => {
  it('测试reactive正常返回响应式对象', () => {
    const origin = {
      foo: 1,
      bar: {
        baz: 2,
      },
    };
    const wrapped = reactive(origin);
    
    // 检查属性
    expect(wrapped).not.toBe(origin);
    expect(wrapped.foo).toBe(1);
    // 使用工具函数检查
    expect(isReactive(wrapped.bar)).toBe(true);
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