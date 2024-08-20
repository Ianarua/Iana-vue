// 存储所有的 effect 对象
export function createDep (effects?) {
  const depSet =  new Set(effects);
  return depSet;
}