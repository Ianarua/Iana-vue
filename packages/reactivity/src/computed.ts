import { ReactiveEffect } from './effect';
import { createDep, type Dep } from './dep';
import { RefImpl, trackRefValue, triggerRefValue } from './ref';

export type ComputedGetter<T> = (oldValue?: T) => T

export class ComputedRefImpl<T> {
  public dep: Dep;
  public readonly effect: ReactiveEffect<T>;
  public readonly __v_isRef = true;

  private _value: T | undefined;
  private _dirty: boolean;

  constructor(getter: ComputedGetter<T>) {
    this._dirty = true;
    this.dep = createDep();
    this.effect = new ReactiveEffect(
      getter,
      () => {
        // scheduler
        // 只要触发了这个函数说明响应式对象的值发生改变了
        // 那么就解锁，后续在调用 get 的时候就会重新执行，所以会得到最新的值
        if (this._dirty) return;
        this._dirty = true;
        triggerRefValue(this);
      },
    );
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    // 锁上，只可以调用一次
    // 当数据改变的时候才会解锁
    // 这里就是缓存实现的核心
    // 解锁是在 scheduler 里面做的
    if (this._dirty) {
      this._dirty = false;
      // 这里执行 run , 就是执行用户传入的 fn
      this._value = this.effect.run();
    }

    return this._value;
  }
}

export type ComputedRef<T> = InstanceType<typeof ComputedRefImpl<T>>;

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T> {
  return new ComputedRefImpl(getter);
}