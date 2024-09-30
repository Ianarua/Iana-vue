import { VNode } from './vnode';

export type Data = Record<string, unknown>


export interface ComponentInternalInstance {
  type: any;
  vnode: VNode;
  next: VNode | null;
  props: any;
  parent: ComponentInternalInstance | null;
  provides: any;
  proxy: any;
  isMounted: boolean;
  attrs: any;
  slots: any;
  ctx: any;
  setupState: any;
  emit: (event: string, ...args: any[]) => void;
}

export function createComponentInstance(vnode: VNode, parent) {
  const instance = {
    type: vnode.type,
    vnode,
    next: null,
    props: {},
    parent,
    provides: parent ? parent.provides : {},
    proxy: null,
    isMounted: false,
    attrs: {},
    slots: {},
    ctx: {},
    setupState: {},
    emit: () => {
    },
  };

  // prod 环境下是以下结构
  // dev 环境会更复杂
  instance.ctx = {
    _: instance
  }

  // 赋值 emit
  // 用 bind 把 instance 进行绑定
  // 用户使用的时候只需要给 event 和 参数 即可
  instance.emit = emit.bind(null, instance) as any;

  return instance;
}