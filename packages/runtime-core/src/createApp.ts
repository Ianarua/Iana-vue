import { createVNode } from './vnode';

export function createAppApi(render) {
  return function createApp(rootComponent) {
    const app = {
      _component: rootComponent,
      mount(rootContainer) {
        console.log('基于根组件创建 vnode');
        const vnode = createVNode(rootComponent);
        console.log('调用render, 基于 vnode 进行开箱');
        render(vnode, rootContainer)
      }
    }

    return app;
  }
}