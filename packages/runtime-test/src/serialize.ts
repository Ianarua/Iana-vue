// 把 node 序列化
// 供测试用

import { NodeTypes } from './nodeOps';

export function serialize(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return serializeElement(node);
  } else {
    return serializeText(node);
  }
}

function serializeText(node) {
  return node.text;
}

function serializeElement(node) {
  // 把 props 处理成字符串
  /**
   * 如果 value 是 null , 返回 ``
   * 如果 value 是 `` , 返回 key
   * 不然返回 key = value (value需要字符串化)
   */
  const props = Object.keys(node.props).map(key => {
    const value = node.props[key];
    if (value === null) {
      return ``;
    } else if (value === ``) {
      return key;
    } else {
      return `${ key }=${ JSON.stringify(value) }`;
    }
  })
    .filter(Boolean)
    .join(' ');

  return `<${ node.tag }${ props ? ` ${ props }` : `` }>${ serializeInner(node) }</${ node.tag }>`;
}

export function serializeInner(node) {
  // 把 所有节点 变成一个 string
  return node.children.map(c => serialize(c)).join(``);
}