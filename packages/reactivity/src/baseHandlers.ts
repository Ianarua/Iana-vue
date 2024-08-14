import { ReactiveFlags, reactiveMap, readonlyMap, shallowReadonlyMap } from './reactive';
import { isObject } from '@mini-vue/shared';

const get = createGetter();
const set = createSetter();

function createGetter(isReadonly = false, shallow = false) {
  /**
   * @param target 原始对象
   * @param key 被访问的属性名
   * @param receiver 触发属性访问的代理对象本身 (即proxy本身) 用来调整this指向(通过Reflect)
   */
  return function get(target, key, receiver) {
    // 使用特殊方式访问原始对象(.__v_raw)
    const isExistInReactiveMap = () =>
      key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);
    const isExistInReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);
    const isExistInShallowReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target);

    // 如果key已经是响应式/只读，直接返回true/false
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (isExistInReactiveMap() || isExistInReadonlyMap() || isExistInShallowReadonlyMap()) {
      // 使用特殊情况访问，返回原始对象
      return target;
    }

    // key是原始对象，添加响应式
    // 使用Reflect的好处是可以调整this指向
    const res = Reflect.get(target, key, receiver);

    // readonly不需要做依赖收集(只读)
    if (isReadonly) {
      // 在触发 get 的时候进行依赖收集
      track(target, 'get', key);
    }

    // 浅响应式
    if (shallow) {
      return res;
    }

    // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
    // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
    // res 等于 target[key]
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver);

    // 触发 set 的时候 使用副作用函数
    trigger(target, 'set', key);

    return res;

  };
}

export const mutableHandlers = {
  get,
  set,
};