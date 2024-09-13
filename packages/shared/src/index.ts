export * from './shapeFlags';

// 是否为对象
export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

// 扩展
export const extend = Object.assign;

// 是否变化
export function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue);
}