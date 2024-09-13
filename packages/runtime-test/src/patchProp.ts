/**
 * @description 更新元素属性值，用于更新 元素的属性值
 * @param el 要更新属性的DOM元素
 * @param key 要更新的属性名
 * @param prevValue 属性的旧值
 * @param nextValue 属性的新值
 */
export function patchProp(el, key, prevValue, nextValue) {
  el.props[key] = nextValue;
}
