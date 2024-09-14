import { ShapeFlags } from '@iana-vue/shared';

// 用 symbol 作为唯一标识
export const Text = Symbol.for('v-txt');
export const Fragment = Symbol.for('v-fgt');

// VNode 虚拟节点的类型
export interface VNode {
  // 虚拟节点 对应的 真实节点 的引用
  el: any;
  // 存储虚拟节点对应的组件实例
  component: any;
  // 用于唯一标识虚拟节点，有助于提高虚拟 DOM 的 diff 算法效率
  key: string | number | undefined;
  // 定义了虚拟节点的类型，如元素类型或组件类型
  type: VNodeTypes;
  // 存储虚拟节点对应元素或组件的属性对象
  props: any;
  // 存储虚拟节点的子节点
  children: any;
  // 一个内部使用的标志位，用于标识虚拟节点的形状或类型，如是否为文本节点或元素节点
  shapeFlag: number;
}

export type VNodeTypes =
  | string
  | Object
  | VNode
// | Component
  | typeof Text
  | typeof Fragment

/**
 * @description 创建虚拟节点
 * @param type 节点类型，可能是string(如"div")，不是string即为组件对象
 * @param props 节点属性，如style
 * @param children 子节点，可能是字符串（createVNode("div", {}, "Hello World") 文本节点），也可能是数组
 * @example createVNode("div", {}, "Hello World")
 * @example createVNode(App)
 */
export const createVNode = function (
  type: VNodeTypes,
  props?: any,
  children?: string | Array<any>,
) {
  /**
   * type 有可能是 string 也有可能是 对象
   * 对象的话，就是用户设置是 options
   * string 的话，createVNode("div")
   * 组件对象 的时候，createVNode(App)
   */
  const vnode = {
    el: null,
    component: null,
    key: props?.key,
    type,
    props: props || {},
    children,
    shapeFlag: getShapeFlag(type),
  };

  // 基于 children 再次设置 shapeFlag, 如果是数组，则设置 ARRAY_CHILDREN 标志位， 如果是字符串则为 文本
  if (Array.isArray(children)) {
    /**
     * 如果 vnode 初始化 shapeFlag 是 HTMLElement(string)，并且 children 是 Array
     * 则运算流程为：
     * 1.HTMLElement -> ELEMENT(1)
     * 2. 1 |= (1 << 4)
     * 3. 结果为: 17
     */

    /**
     * 如果 vnode 初始化 shapeFlag 是 Component，并且 children 是 Array
     * 1. 组件类型 -> STATEFUL_COMPONENT(1 << 2 = 4)
     * 2. 4 |= (1 << 4)
     * 3. 结果为: 20
     */
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === 'string') {
    /**
     * 初始化 HTMLElement(string), children 是 string
     * 1. HTMLElement -> ELEMENT(1)
     * 2. 1 |= (1 << 3)
     * 3. 结果为: 9
     */

    /**
     * 初始化 Component, children 是 string
     * 1. 组件类型 -> STATEFUL_COMPONENT(1 << 2 = 4)
     * 2. 4 |= (1 << 3)
     * 3. 结果为: 12
     */
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }

  normalizeChildren(vnode, children);

  return vnode;
};

/**
 * @description 标准化 vnode 的 children 属性，根据不同的 VNode 类型设置相应的标志位
 * @param vnode
 * @param children
 */
export function normalizeChildren(vnode: VNode, children: unknown) {
  if (typeof children === 'object') {
    // 只实现三种，element component slot
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      // 如果 VNode 表示的是一个元素节点
      // 则 children 不会被视为 slot，因为元素节点的 children 应当是直接的内容而非 slot
      // 不需要进行任何操作，跳过处理
    } else {
      // 此时 vnode 必然是组件类型，并且其 children 是 slots
      // 设置 vnode 的 shapeFlag(表示其 children 为 slots)
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
}

// 标准化 vnode 的格式，目的是让 child 支持多种格式
export function normalizeVNode(child: any) {
  if (typeof child === 'string' || typeof child === 'number') {
    return createVNode(Text, null, String(child));
  } else {
    return child;
  }
}

export function createTextVNode(text: string = '') {
  return createVNode(Text, null, text);
}

/**
 * @description 基于 type 来判断是什么类型的组件
 * @param type string为html元素，如"div", 不是string即组件
 */
function getShapeFlag(type: VNodeTypes): number {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
