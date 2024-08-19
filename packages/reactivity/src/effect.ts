// 当前收集的依赖(函数)
import { extend } from '@mini-vue/shared';

let activeEffect = void 0;
// 是否可以开始收集依赖
let shouldTrack = false;
// 依赖的map
const targetMap = new WeakMap();

// 依赖收集
export class ReactiveEffect {
  private active = true;
  public deps = [];
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

export function effect(fn, options = {}) {
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

export function track(target, type, key) {
  if (!isTracking()) {
    return;
  }
  console.log(`触发 track -> target: ${ target } type:${ type } key:${ key }`);
  // 1. 先基于 target 找到对应的 dep
  // 第一次，就需要初始化
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 初始化 depsMap 的逻辑
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 获取依赖weakMap
  let dep = depsMap.get(key);

  if (!dep) {
    dep = createDep();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects () {}


export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}