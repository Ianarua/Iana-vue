import { ReactiveEffect } from './effect';
import { createDep } from './dep';
import { trackRefValue, triggerRefValue } from './ref';
export class ComputedRefImpl {
    constructor(getter) {
        this.__v_isRef = true;
        this._dirty = true;
        this.dep = createDep();
        this.effect = new ReactiveEffect(getter, () => {
            if (this._dirty)
                return;
            this._dirty = true;
            triggerRefValue(this);
        });
    }
    get value() {
        trackRefValue(this);
        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value;
    }
}
export function computed(getter) {
    return new ComputedRefImpl(getter);
}
//# sourceMappingURL=computed.js.map