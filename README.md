# Iana-vue

## 一、Monorepo组织管理构建

### package.json

`pnpm init`

* rollup: 构建工具rollup相关依赖
* tslib: 辅助ts的依赖
* vitest: Vite集成的测试框架
* script脚本
  * "dev": "rollup -c -w"
    * -c: 构建时用rollup.config.ts配置文件
    * -w: 监听
  * "build": "rollup -c"
  * "test": "vitest run" 运行__test__下的所有测试文件
    * 测试文件以.test.ts或.spec.ts为后缀

### tsconfig.json

`tsc --init`
typescript的配置

### rollup.config.ts

rollup的相关配置项

## 二、packages

* reactivity 响应式系统
* share 仓库中中多个包之间共享的工具或功能模块

### reactivity

* 