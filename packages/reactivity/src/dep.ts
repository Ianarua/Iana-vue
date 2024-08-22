import { ReactiveEffect } from './effect';

export type Dep = Set<ReactiveEffect>

export function createDep(effects?: ReactiveEffect[]): Dep {
  const depSet = new Set(effects);
  return depSet;
}