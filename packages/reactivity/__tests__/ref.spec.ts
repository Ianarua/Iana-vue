import { effect, isRef, reactive, ref, unRef } from '@iana-vue/reactivity';
import { expect } from 'vitest';

describe('ref', () => {
  it('ref响应式功能', () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    // 测试副作用函数是否初始化执行
    expect(dummy).toBe(1);
    // 测试响应式
    a.value.count = 2;
    expect(a.value.count).toBe(2);
    expect(dummy).toBe(2);

  });

  it('ref赋相同值不重复运行', () => {
    const a = ref(1);
    let dummy;
    const spy = vi.fn(() => {
      dummy = a.value;
    });
    effect(spy);
    a.value = 2;
    expect(dummy).toBe(2);
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('测试isRef', () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(user)).toBe(false);
  });

  it('测试unRef', () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  })
});