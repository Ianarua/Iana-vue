import { nodeOps } from './nodeOps';
import { extend } from '@iana-vue/shared';
import { createRenderer } from '@iana-vue/runtime-core';
import { patchProp } from './patchProp';

export const { render } = createRenderer(extend({ patchProp }, nodeOps));

export * from './nodeOps';
export * from './serialize';