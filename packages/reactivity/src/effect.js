import { extend } from '@iana-vue/shared';
import { createDep } from './dep';
let activeEffect = void 0;
let shouldTrack = false;
const targetMap = new WeakMap();
export class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
        this.fn = fn;
        this.scheduler = scheduler;
        console.log('创建 ReactiveEffect 对象');
    }
    run() {
        console.log('ReactiveEffect run');
        if (!this.active) {
            return this.fn();
        }
        shouldTrack = true;
        activeEffect = this;
        console.log('执行用户传入的 fn');
        const res = this.fn();
        shouldTrack = false;
        activeEffect = void 0;
        return res;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach(dep => dep.delete(effect));
    effect.deps.length = 0;
}
export function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
export function stop(runner) {
    runner.effect.stop();
}
export function track(target, key) {
    if (!isTracking()) {
        return;
    }
    console.log(`触发 track -> target: ${target} key:${key}`);
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let depsSet = depsMap.get(key);
    if (!depsSet) {
        depsSet = createDep();
        depsMap.set(key, depsSet);
    }
    trackEffects(depsSet);
}
export function trackEffects(depsSet) {
    if (!depsSet.has(activeEffect)) {
        depsSet.add(activeEffect);
        activeEffect.deps.push(depsSet);
    }
}
export function trigger(target, key) {
    let deps = [];
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const depsSet = depsMap.get(key);
    deps.push(depsSet);
    const effects = [];
    deps.forEach(depsSet => {
        effects.push(...depsSet);
    });
    triggerEffects(createDep(effects));
}
export function triggerEffects(depsSet) {
    for (const effect of depsSet) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
//# sourceMappingURL=effect.js.map