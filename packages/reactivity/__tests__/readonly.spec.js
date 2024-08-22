import { isReactive, isReadonly, readonly } from '@iana-vue/reactivity';
import { expect } from 'vitest';
const original = {
    foo: 1,
    bar: {
        baz: 2,
    },
};
const wrapped = readonly(original);
describe('readonly', () => {
    it('测试readonly是否正常作用', () => {
        expect(wrapped).not.toBe(original);
        wrapped.foo = 2;
        expect(wrapped.foo).toBe(1);
    });
    it('测试isReadonly是否可用, 以及嵌套', () => {
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReactive(wrapped)).toBe(false);
        expect(isReactive(wrapped.bar)).toBe(false);
        expect(isReadonly(wrapped.bar)).toBe(true);
    });
});
//# sourceMappingURL=readonly.spec.js.map