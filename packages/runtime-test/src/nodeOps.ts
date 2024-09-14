export const enum NodeTypes {
  ELEMENT = 'ELEMENT',
  TEXT = 'TEXT',
}

let nodeId = 0;

export interface TestElement {
  id: number;
  type: NodeTypes.ELEMENT;
  parentNode: TestElement | null;
  tag: string;
  props: Record<string, any>;
  children: Array<any>;
}

/**
 * @description 在 runtime-core 初始化 element 时候调用
 * @param tag 节点的 tag，如"div"
 * @return node 对象，内部包含该节点的属性
 */
function createElement(tag: string): TestElement {
  return {
    tag,
    id: nodeId++,
    type: NodeTypes.ELEMENT,
    props: {},
    children: [],
    parentNode: null,
  };
}

/**
 * @description 将一个子元素插入到指定父元素中
 *
 * 此函数通过将子元素添加到父元素的children数组中，并设置子元素的parentNode属性为当前父元素，
 * 实现了在数据结构上建立父子关系的操作该操作模拟了DOM（文档对象模型）中appendChild方法的功能，
 * 使得数据结构能够在内存中模拟实际的DOM树结构
 *
 * @param child 当前节点，即 要插入的子元素
 * @param parent 父元素，即 container 元素
 */
function insert(child, parent) {
  // 将子元素添加到父元素的子元素列表中
  parent.children.push(child);
  // 设置子元素的父节点属性为当前父元素
  child.parentNode = parent;
}

/**
 * @description 设置元素 文本节点，并将 文本节点 添加到 el 的children数组中
 * @param el
 * @param text
 */
function setElementText(el, text) {
  el.children = [
    {
      id: nodeId++,
      type: NodeTypes.TEXT,
      text,
      parentNode: el,
    },
  ];
}

// host开头的函数
export const nodeOps = { createElement, insert, setElementText };