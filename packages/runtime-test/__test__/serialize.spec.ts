import { describe } from 'vitest';
import { serialize } from '../src';

describe('元素序列化', () => {
  it('序列化 text node', () => {
    const textNode = {
      type: 'TEXT',
      text: 'Hello World',
    };

    const result = serialize(textNode);
    expect(result).toBe('Hello World');
  });
  it('带有属性的元素节点', () => {
    const elementNode = {
      type: 'ELEMENT',
      tag: 'div',
      props: {
        class: 'container',
        'data-test': 'element',
      },
      children: [],
    };

    const result = serialize(elementNode);
    expect(result).toBe('<div class="container" data-test="element"></div>');
  });
});