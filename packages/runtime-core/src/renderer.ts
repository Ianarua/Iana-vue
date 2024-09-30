import { type VNode, Text, Fragment } from './vnode';
import { ShapeFlags } from '@iana-vue/shared';
import { createAppApi } from './createApp';

export interface RendererNode {
  [key: string | symbol]: any;
}

export function createRenderer(options) {
  const {
    // 创建 element，这个就是 createElement(runtime-test/src/nodeOps.ts)
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    // 对比元素新老属性
    patchProp: hostPathProp,
    // 插入 element
    insert: hostInsert,
    // 删除 element
    remove: hostRemove,
    // 设置 text
    setText: hostSetText,
    createText: hostCreateText,
  } = options;

  /**
   *
   * @param {VNode} vnode 虚拟节点
   * @param container 父容器（真实节点）
   */
  const render = <T = any>(vnode: VNode, container: T) => {
    console.log('调用 patch');
    // 第一次渲染，没有旧节点
    patch(null, vnode, container as any);
  };

  /**
   * @description 对比新旧节点
   * @param {VNode | null} n1  旧节点, 可能为空（第一次渲染该节点）
   * @param {VNode} n2 新节点
   * @param container 该节点的容器
   * @param anchor 用于 SSR 的锚点节点
   * @param parentComponent 父组件实例，用于VNode的额外处理 TODO
   */
  const patch = (
    n1: VNode | null,
    n2: VNode,
    container = null,
    anchor = null,
    parentComponent = null,
  ) => {
    console.log(`开始path, 旧节点:${ n1 }, 新节点:${ n2 }, 容器:${ container }`);
    // 基于 n2 的类型判断，因为 n2 是新 vnode
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        // 是 HTMLElement 或者 组件 ，基于 shapeFlag 处理
        if (shapeFlag & ShapeFlags.ELEMENT) {
          console.log('处理 element');
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          console.log('处理 component');
          processComponent(n1, n2, container, parentComponent);
        }
    }
  };

  const processText = (n1: VNode | null, n2: VNode, container: any) => {
    console.log('处理 Text 节点');
    if (n1 === null) {
      // n1 是 null 说明是 init 阶段
      // 基于 createText 创建出 text 节点， 然后使用 insert 添加到 el 内
      console.log('初始化 Text 类型的节点');
      hostInsert((n2.el = hostCreateText(n2.children as string)), container);
    } else {
      /**
       * update 阶段
       * 对比 updated 之后的内容是否和之前的不一样
       * 不一样才需要 update text
       * 这里抽离出来的接口是 setText
       * 注意，一定要记得把 n1.el 复制给 n2.el, 不然后续找不到值
       */
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        console.log('更新 Text 类型节点');
        hostSetText(el, n2.children as string);
      }
    }
  };

  const processFragment = (n1: VNode | null, n2: VNode, container: any) => {
    // 只需渲染 children , 然后添加到 container 内
    if (!n1) {
      // 初始化 Fragment
      console.log('初始化 Fragment 类型的节点');
      // mountChildren(n2.children, container);
    }
  };

  // 从这开始是 Element 相关逻辑
  /**
   * @description 处理 element 类型的节点，相当于一个 中间处理函数 ，决定这个节点是 挂载（第一次） 还是更新
   * @param {VNode | null} n1  旧节点, 可能为空（第一次渲染该节点）
   * @param {VNode} n2 新节点
   * @param container 该节点的容器
   * @param anchor 用于 SSR 的锚点节点
   * @param parentComponent 父组件实例，用于VNode的额外处理 TODO
   */
  const processElement = (n1: VNode | null, n2: VNode, container: any, anchor, parentComponent) => {
    if (!n1) {
      console.log('初始化 Element 类型的节点');
      mountElement(n2, container, anchor, parentComponent);
    } else {
      // update
      console.log('更新 Element 类型的节点');
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  };

  /**
   * @description 挂载 element 节点（第一次渲染该节点）
   * @param {VNode} vnode 节点
   * @param container 该节点的容器
   * @param anchor 用于 SSR 的锚点节点
   * @param parentComponent 父组件实例，用于VNode的额外处理 TODO
   */
  const mountElement = (vnode: VNode, container: any, anchor, parentComponent) => {
    const { props, shapeFlag } = vnode;
    // 1. 先创建 element, 创建了一个基于 vnode 的 类真实dom, el保存了对这个 类真实dom 的引用
    const el = (vnode.el = hostCreateElement(vnode.type));

    // 2. 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      /**
       * @description 处理 Text 类型的节点
       * @example
       * render () {
       *   return h('div', {}, 'hello world')
       * }
       * 这里的 children 就是 text, 直接渲染
       */
      console.log(`处理文本:${ vnode.children }`);
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      /**
       * @description 处理 Array 类型的节点, 递归处理
       * @example
       * render () {
       *   return h('div', {}, [h('p'), h(Component)])
       * }
       */
      // 这里 children 是数组，递归处理
      mountChildren(vnode.children, el);
    }

    // 处理 props
    if (props) {
      for (const key in props) {
        // 过滤掉 vue 自身用的key: 如 onClick
        const nextVal = props[key];
        hostPathProp(el, key, null, nextVal);
      }
    }

    // TODO 触发 beforeMount() 钩子
    console.log('vnodeHook  -> onVnodeBeforeMount');
    console.log('DirectiveHook  -> beforeMount');
    console.log('transition  -> beforeEnter');

    // 处理完成，插入到 container 内
    hostInsert(el, container, anchor);

    // TODO 触发 mounted() 钩子
    console.log('vnodeHook  -> onVnodeMounted');
    console.log('DirectiveHook  -> mounted');
    console.log('transition  -> enter');
  };

  const updateElement = (n1: VNode, n2: VNode, container: any, anchor, parentComponent) => {
    // const oldProps = n1?.props || {};
    // const newProps = n2.props || {};
    // // 更新 element
    // console.log('应该更新 Element');
    // console.log('旧的 vnode', n1);
    // console.log('新的 vnode', n2);
    //
    // // 把 el 挂载到新的 vnode
    // const el = (n2.el = n1.el);
    //
    // // 对比 props
    // patchProps(el, oldProps, newProps);
    //
    // // 对比 children
    // patchChildren(n1, n2, el, anchor, parentComponent);
  };

  /**
   * @description Array类型的节点，处理 vnode 的 children，遍历每个 child 并调用 path e
   * @param children
   * @param container
   */
  function mountChildren(children, container) {
    children.forEach(vnodeChild => {
      console.log('初始化 children:', vnodeChild);
      patch(null, vnodeChild, container);
    });
  }

  // 从这开始是 Component 逻辑
  function processComponent(n1, n2, container, parentComponent) {
    // 如果 n1 没有值的话，那么就是 mount
    if (!n1) {
      // 初始化 component
      mountComponent(n2, container, parentComponent);
    } else {
      updateComponent(n1, n2, container);
    }
  }

  // Component 初始化
  function mountComponent(initialVNode, container, parentComponent) {
    // 1. 先创建一个 component instance
    const instance = (
      initialVNode.component = createComponentInstance(initialVNode, parentComponent)
    );
    console.log(`创建组件实例:${ instance.type.name }`);
    // 2. 对 instance 加工
    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }


  return {
    render,
    createApp: createAppApi(render),
  };
}