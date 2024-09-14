import { h } from '@iana-vue/runtime-core';
import { nodeOps, render, serializeInner } from '@iana-vue/runtime-test';

describe('renderer element', () => {
  let root;

  beforeEach(() => {
    root = nodeOps.createElement('div');
  });

  it('利用 h 创建一个 HTMLElement', () => {
    const element = h('div', root);
    expect(element.type).toEqual('div');
  });

  it('render 一个 HTMLElement', () => {
    render(h('div', { class: 'foo' }), root);
    expect(serializeInner(root)).toBe('<div class="foo"></div>');
  });

  it('render 一个带 children(文本节点) 的 HTMLElement', () => {
    render(h('div', { class: 'foo', 'vFor': 'bar' }, 'hello'), root);
    expect(serializeInner(root)).toBe('<div class="foo" vFor="bar">hello</div>');
  });
});