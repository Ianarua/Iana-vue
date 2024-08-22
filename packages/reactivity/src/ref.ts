import { createDep } from './dep';
import { hasChanged, isObject } from '@iana-vue/shared';
import { reactive } from './reactive';
import { isTracking, ReactiveEffect, trackEffects, triggerEffects } from './effect';

export class RefImpl<T> {
  // 原始值, 即用户设置的值
  private _rawValue: T;
  // 响应式值
  private _value: T;
  // 存储依赖于该 ref 值的副作用函数
  public dep: Set<ReactiveEffect>;
  // 标记该实例为 ref 类型，用于内部类型检查。
  public readonly __v_isRef = true;

  constructor(value: T) {
    this._rawValue = value;
    // 先检查 value 是否是一个对象, 是一个对象就需要用 reactive 包裹
    this._value = convert(value);
    this.dep = createDep<ReactiveEffect>();
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newValue: T) {
    // 当 新值 不等于 老值 才触发依赖
    if (hasChanged(newValue, this._rawValue)) {
      // 更新响应式z值
      this._value = convert(newValue);
      // 更新原始值
      this._rawValue = newValue;
      // 触发依赖
      triggerRefValue(this);
    }
  }
}

export type Ref<T> = InstanceType<typeof RefImpl<T>>;

/**
 * @description 创建并返回一个 ref 实例，用于包装给定的值。
 * @template T 要包装的值的类型。
 * @param value 要包装的值。
 * @returns 返回包含响应式引用的 Ref 实例。
 */
export function ref<T>(value: T) {
  return createRef<T>(value);
}

/**
 * @description 将值转换为响应式形式，如果值是对象则使用 reactive 函数包裹
 * @template T 值的类型。
 * @param value 要转换的值。
 * @returns 返回响应式值。
 */
function convert<T>(value: T) {
  return isObject(value) ? reactive(value) : value;
}

/**
 * @description 实际创建 ref 实例的工厂函数。
 * @template T 要包装的值的类型。
 * @param value 要包装的值。
 * @returns 返回 Ref 实例。
 */

function createRef<T>(value: T) {
  const refImpl = new RefImpl<T>(value);
  return refImpl;
}

export function trackRefValue(ref: Ref<any>) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function triggerRefValue(ref: Ref<any>) {
  triggerEffects(ref.dep);
}

// const shallowUnwrapHandlers = {
//   get(target, key, receiver) {
//
//   },
//   set (target, key, value, receiver) {
//
//   }
// }

export type MaybeRef<T = any> = T | Ref<T>
/**
 * @description 如果参数是 ref，则返回内部值，否则返回参数本身
 * 这是 val = isRef(val) ? val.value : val 计算的一个语法糖
 * @param ref
 */
export function unRef(ref: MaybeRef) {
  return isRef(ref) ? ref.value : ref;
}

export function isRef(value: any) {
  return !!(value && value.__v_isRef);
}