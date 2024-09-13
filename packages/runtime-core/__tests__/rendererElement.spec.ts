import { h } from '@iana-vue/runtime-core';
import { nodeOps, render, serializeInner } from '@iana-vue/runtime-test';

describe('renderer element', () => {
  let root;

  beforeEach(() => {
    root = nodeOps.createElement('div');
  });

  it('利用 h 创建一个 element', () => {
    const element = h('div', root);
    expect(element.type).toEqual('div');
  });

  it('render 一个 HTMLElement', () => {
    render(h('div'), root);
    expect(serializeInner(root)).toBe('<div></div>');
  });
});