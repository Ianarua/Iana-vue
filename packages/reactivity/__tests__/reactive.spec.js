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
        expect(wrapped).not.toBe(origin);
        expect(wrapped.foo).toBe(1);
        expect(isReactive(wrapped.bar)).toBe(true);
    });
    it('测试reactive触发副作用函数', () => {
        const origin = reactive({ num: 1 });
        let cnt = 0;
        const renderSpy = vi.fn(() => (cnt = origin.num));
        effect(renderSpy);
        expect(cnt).toBe(1);
        origin.num = 2;
        expect(cnt).toBe(2);
    });
});
//# sourceMappingURL=reactive.spec.js.map