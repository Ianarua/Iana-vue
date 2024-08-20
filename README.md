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

### pnpm-workspace.yaml

pnpm不支持在package.json中配置的workspace字段, 需要新建名为这个的文件进行配置

## 二、packages

* reactivity 响应式系统
* share 仓库中中多个包之间共享的工具或功能模块

### reactivity

#### 1. 创建reactive Proxy

* reactive.ts
* baseHandler.ts

`createReactiveObject`操作。
有三个参数, target, proxyMap, baseHandlers

* proxyMap: 用来缓存已建立起来的proxy, 如果命中map, 就直接返回, 防止重复创建react
* baseHandlers: 创建proxy的getter、setter
    * getter
        * 首先需要判断是不是特殊情况访问
        * 如果是正常情况，需要搭配Reflect来进行对象操作
        * 之后进行依赖收集`track`
        * 判断是否还是为对象，递归调用
        * 不是对象了，就return
    * setter
        * 仍然用Reflect作为访问对象的容器
        * `trigger`触发副作用函数

> Reflect的好处:
> 1. Reflect和Proxy可以配套使用
> 2. receiver参数，可以指定this的指向
> 如果我在模板的使用过程中proxy.alias变了
> * target[key] 方式访问 proxy.alias 时，获取到 this.name，此时 this 指向 target，无法监控到 name ，不能重新渲染
> * Reflect 方式访问 proxy.alias 时，获取到 this.name，此时 this 指向 proxy，可监控到 name ，可以重新渲染

```javascript
const target = {
  name: '柏成',
  get alias() {
    console.log('this === target', this === target); // true
    console.log('this === proxy', this === proxy); // false
    return this.name;
  },
};
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    console.log('key:', key);
    return target[key];
    // return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  },
});
proxy.alias;
```
#### 2. 依赖收集`track`

* effect.ts
* 