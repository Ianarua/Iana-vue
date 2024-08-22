import { mutableHandlers, readonlyHandlers } from './baseHandlers';
export var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));
export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export function reactive(target) {
    return createReactiveObject(target, reactiveMap, mutableHandlers);
}
export function readonly(target) {
    return createReactiveObject(target, readonlyMap, readonlyHandlers);
}
function createReactiveObject(target, proxyMap, baseHandlers) {
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}
export function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
export function isReadonly(value) {
    return !!value["__v_isReadonly"];
}
export function isReactive(value) {
    return !!value["__v_isReactive"];
}
//# sourceMappingURL=reactive.js.map