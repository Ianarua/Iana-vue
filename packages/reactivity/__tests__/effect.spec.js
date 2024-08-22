import { effect } from '../src/effect';
import { reactive } from '../src/reactive';
import { expect } from 'vitest';
describe('effect', () => {
    it('独立执行副作用函数是否正常运行', () => {
        const fnSpy = vi.fn(() => {
            console.log('fnSpy执行了');
        });
        effect(fnSpy);
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });
    it('监听副作用函数是否在响应式系统中正常运行', () => {
        let dummy;
        const counter = reactive({ num: 0 });
        effect(() => (dummy = counter.num));
        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
    });
});
//# sourceMappingURL=effect.spec.js.map