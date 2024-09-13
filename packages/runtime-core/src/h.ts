import { createVNode } from './vnode';

/**
 *
 * @param type
 * @param props
 * @param children
 * @return {VNode} vnode虚拟节点
 */
export const h = (type: any, props: any = null, children: string | Array<any> = []) => {
  return createVNode(type, props, children)
}