import { h } from '@iana-vue/runtime-core';
import { nodeOps, render, serializeInner } from '@iana-vue/runtime-test';
import { expect } from 'vitest';

describe('renderer Component', () => {
  it('创建一个 Component', () => {
    const Comp = {
      render: () => {
        return h('div');
      },
    };
    const root = nodeOps.createElement('div');
    render(h(Comp), root);
    expect(serializeInner(root)).toBe(`<div></div>`)
  });
});