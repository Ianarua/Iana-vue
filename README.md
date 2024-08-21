# Iana-vue

已完成: 
* reactive(支持嵌套)
* track依赖收集
* trigger依赖触发
* readonly(支持嵌套)
* isProxy
* isReactive
* isReadonly
* effect.scheduler
* effect.stop

- [Monorepo组织管理构建](#一monorepo组织管理构建)
  - [package.json说明](#packagejson)
  - [tsconfig.json说明](#tsconfigjson)
  - [rollup.config.ts说明](#rollupconfigts)
  - [pnpm-workspace.yaml说明](#pnpm-workspaceyaml)
- [packages包](#二packages)
  - [reactivity](#reactivity)
    - [1. reactive的响应式系统整个流程](#1-reactive的响应式系统整个流程)
    - [2. 创建reactive Proxy步骤](#2-创建reactive-proxy步骤)
    - [3. track依赖收集](#3-track依赖收集)
    - [4. trigger依赖触发](#4-trigger依赖触发)

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

#### 1. reactive的响应式系统整个流程

1. 被reactive包裹会先创建proxy, 并植入getter、setter(这里有缓存优化WeakMap, 会先找是否已经存在)
    * 会存在全局的WeakMap中, key是源对象, value是这个对象的代理. 具体见下`2. 创建reactive Proxy步骤`
2. 创建函数后(与代理对象相关的函数), 放入effect中收集该副作用函数
    * 创建 ReactiveEffect 实例
    * 创建完直接触发 run() 方法, 执行一次副作用函数
    * **上一步的执行过程中** **会触发getter**(`track方法`, 因为读取了代理的值). 具体见下`3. track依赖收集`
    * 如果`isObject` 则根据`isReadonly`递归调用 readonly 或 reactive (**支持嵌套**)
    * 触发getter后返回获取到的值(`Reflect.get(target, key, receiver)`的返回值)
    * 重置`shouldTrack`和**`activeEffect`**, 目的是为了防止setter时触发的track重复收集依赖, 下面都有具体说明
    * 最后返回函数执行结果(这个就是纯纯该函数返回的结果, 和上面的getter无关)
    * effect最后使用bind修改this指向
3. 修改了代理对象, 会触发**setter**, setter中触发了`trigger方法`. 具体见下`4. trigger依赖触发`
4. `trigger方法`会执行副作用函数, 执行副作用函数的过程中, 会再次触发getter, 进而会再次触发 `track方法`,
   但是这次就会直接拿到`depsMap`和`depsSet`, 但是由于已经收集过, 所以**不会进行具体依赖收集操作**

#### 2. 创建reactive Proxy步骤

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

#### 3. track依赖收集

> 主要是第一次访问该代理, 之后触发setter -> 执行副作用函数 -> 会再次触发track, 这次的所有if()判断都会为false

依赖结构:

```markdown
targetMap -> 最大的依赖集合, 用来存储全部依赖收集信息
| |
target depsMap -> 当前target(源对象)的key对应的map
| |
key depsSet -> key对应所用到的副作用函数集合
```

1. 先从 targetMap 中找到是否收集过, 没收集过就新建 depsMap
2. 再从 depsMap 中获取依赖集, 没获取到就新建 depsSet, 后将 depsSet 传入`trackEffects`中
3. 收集依赖, 判断 `activeEffect` 是否存在在 depsSet 里面, 不存在就将整个 activeEffect 加入 depsSet; 并且需要将 depsSet
   加入至 `activeEffect.deps` 里面, 以便清除依赖用

#### 4. trigger依赖触发

依赖结构: 同track

```markdown
targetMap -> 最大的依赖集合, 用来存储全部依赖收集信息
| |
target depsMap -> 当前target(源对象)的key对应的map
| |
key depsSet -> key对应所用到的副作用函数集合
```

1. 从 targetMap 中获取 depsMap, 如果没有就直接return, 证明这个依赖当时判断不需要收集
2. 通过 depsMap 拿到 depsSet, 之后传给`triggerEffects`进行触发依赖. (中途的代码是为了让看的时候逻辑更加分离)
3. **执行副作用函数**, 遍历 depsSet 如果有`调度器scheduler`, 就执行 `effect.scheduler()`, 否则就执行`effect.run()`