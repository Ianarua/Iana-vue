import { extend } from '@iana-vue/shared';
import { createDep } from './dep';

// 当前正在收集的依赖
let activeEffect: ReactiveEffect | undefined = void 0;
// 是否可以开始收集依赖
let shouldTrack = false;
// 依赖的map
const targetMap = new WeakMap();

/**
 * targetMap
 * |       |
 * target  depsMap
 *         |    |
 *         key  depsSet
 */

// 依赖收集
export class ReactiveEffect {
  private active = true;
  public deps: Array<any> = [];
  public onStop?: () => void;
  public fn: any;
  public scheduler?: any;

  constructor(fn, scheduler?) {
    this.fn = fn;
    this.scheduler = scheduler;
    console.log('创建 ReactiveEffect 对象');
  }

  run() {
    console.log('ReactiveEffect run');

    // 先判断是不是收集依赖的变量

    // 执行 fn 但是不收集依赖
    if (!this.active) {
      return this.fn();
    }

    // 执行 fn 收集依赖
    // 现在可以收集依赖了
    shouldTrack = true;

    // 执行的时候给全局 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this as any;
    // 执行用户传入的 fn
    console.log('执行用户传入的 fn');
    const res = this.fn();
    // 重置
    shouldTrack = false;
    activeEffect = void 0;

    return res;
  }

  stop() {
    // 如果第一次执行 stop 后 active 就 false 了
    if (this.active) {
      // 为了防止重复调用，执行stop
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}


// 清除依赖
function cleanupEffect(effect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里把这个 effect 删掉
  effect.deps.forEach(dep => dep.delete(effect));

  effect.deps.length = 0;
}

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler;
  scope?: any;
  allowRecurse?: boolean;
  onStop?: () => void;
}

/**
 * @description 用来收集副作用函数
 * @param fn 副作用函数
 * @param options 选项
 */
export function effect(fn, options: ReactiveEffectOptions = {}) {
  const _effect = new ReactiveEffect(fn);

  // 把用户传过来的值合并到 _effect 对象上去
  // extend = Object.assign
  extend(_effect, options);
  _effect.run();

  // 把 _effect.run 方法返回
  // 让用户自行选择调用 fn 的时机
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

/**
 * @description 创建依赖收集的结构, 在getter里面用
 * @param target 目标对象(原对象)
 * @param key 被访问的属性名
 */
export function track(target, key) {
  if (!isTracking()) {
    return;
  }
  console.log(`触发 track -> target: ${ target } key:${ key }`);
  // 先基于 target 找到对应的 depsMap
  // 如果是第一次，就需要初始化
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 初始化 depsMap 的逻辑
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 获取依赖集(Set)
  let depsSet = depsMap.get(key);

  if (!depsSet) {
    depsSet = createDep();
    depsMap.set(key, depsSet);
  }

  trackEffects(depsSet);
}

/**
 * @description 依赖收集，将 依赖(fn) 存入 dep(depsSet) 中
 * @param depsSet {Set} 收集依赖的容器
 */
export function trackEffects(depsSet: Set<ReactiveEffect>) {
  // 这里是一个优化点
  // 先看看这个依赖是不是已经收集了，
  // 已经收集的话，那么就不需要在收集一次了
  // 可能会影响 code path change 的情况
  // 需要每次都 cleanupEffect
  // shouldTrack = !dep.has(activeEffect!);
  if (!depsSet.has(activeEffect!)) {
    depsSet.add(activeEffect!);
    activeEffect!.deps.push(depsSet);
  }
}

/**
 * @description 创建触发依赖的结构
 * @param target 目标对象(原对象)
 * @param key 被访问的属性名
 */
export function trigger(target, key) {
  // 先收集所有的 depsSet 放到 deps 里面
  let deps: Array<any> = [];
  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  // 取出 depsSet
  const depsSet = depsMap.get(key);

  // 放入 deps 里面
  deps.push(depsSet);

  const effects: Array<any> = [];
  deps.forEach(depsSet => {
    // 这里解构 depsSet 得到的是 depsSet 内部存储的 effect
    effects.push(...depsSet);
  });

  triggerEffects(createDep(effects));
}

/**
 * @description 触发依赖
 * @param depsSet {Set} 该属性相关的所有依赖集
 */
export function triggerEffects(depsSet: Set<ReactiveEffect>) {
  // 执行依赖
  for (const effect of depsSet) {
    if (effect.scheduler) {
      // scheduler 可以让用户自己选择调用的时机
      // 这样就可以灵活的控制调用了
      // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}