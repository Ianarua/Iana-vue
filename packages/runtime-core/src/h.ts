import { createVNode, VNode, VNodeTypes } from './vnode';

/**
 * @description 该创建虚拟节点的工厂函数
 * @param {VNodeTypes} type 节点类型，可能是string(如"div")，不是string即为组件对象
 * @param props 元素的属性对象，包含了一些属性名-属性值的键值对。默认为 null
 * @param children 元素的子元素或者文本内容。可以是一个字符串或者一个包含多个子元素的数组。默认为空数组
 * @return {VNode} vnode虚拟节点
 */
export const h = (type: VNodeTypes, props: any = null, children: string | Array<any> = []): VNode => {
  return createVNode(type, props, children);
};