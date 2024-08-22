// 存储所有的 effect 对象
export function createDep <T>(effects?) {
  const depSet: Set<T> =  new Set(effects);
  return depSet;
}