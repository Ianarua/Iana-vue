// 当前收集的依赖(函数)
let activeEffect = void 0;
// 是否可以开始收集依赖
let shouldTrack = false;

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