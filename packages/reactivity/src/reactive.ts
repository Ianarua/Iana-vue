import { mutableHandlers, readonlyHandlers } from './baseHandlers';

// 定义一个枚举 ReactiveFlags，包含用于标识 reactive 对象的属性键
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}

// 声明并初始化 reactive 对象的 WeakMap 缓存，用于存储 reactive 对象的代理
export const reactiveMap = new WeakMap();
// 声明并初始化 readonly 对象的 WeakMap 缓存，用于存储只读代理
export const readonlyMap = new WeakMap();

/**
 * @param target 需要被转换为响应式的对象
 * @return 返回一个代理，该代理会拦截并响应对象属性的访问和修改
 */
export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

/**
 * @description createReactiveObject 函数用于创建一个响应式代理对象, 它基于传入的目标对象、代理缓存映射和基础处理程序。
 * @param target - 需要被代理的目标对象
 * @param proxyMap - 存储代理对象的 WeakMap 缓存，以确保每个目标对象只被代理一次
 * @param baseHandlers - 定义了代理对象行为的处理程序
 * @return 返回创建的响应式代理对象
 */
function createReactiveObject<T extends object>(
  target: T,
  proxyMap: WeakMap<T, T>,
  baseHandlers: ProxyHandler<T>,
): T {
  // 首先检查目标对象是否已经有对应的代理存在，以利用缓存优化
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 创建代理时，确保它具有与目标对象相同的类型
  const proxy = new Proxy(target, baseHandlers) as T;

  // 将新创建的代理对象存储到 proxyMap 中，确保后续可以直接获取
  proxyMap.set(target, proxy);
  return proxy;
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isReactive(value) {
  // 如果 value 是 proxy 的话
  // 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE];
}