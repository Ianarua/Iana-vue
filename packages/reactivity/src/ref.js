import { createDep } from './dep';
import { hasChanged, isObject } from '@iana-vue/shared';
import { reactive } from './reactive';
import { isTracking, trackEffects, triggerEffects } from './effect';
export class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = createDep();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerRefValue(this);
        }
    }
}
export function ref(value) {
    return createRef(value);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function createRef(value) {
    const refImpl = new RefImpl(value);
    return refImpl;
}
export function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
export function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
export function isRef(value) {
    return !!(value && value.__v_isRef);
}
//# sourceMappingURL=ref.js.map