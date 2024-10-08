# Iana-vue

已完成:

* 手写多模块打包
* Promise.all并行打包
* 支持scripts传参进行打包指定package
* 支持scripts传参进行打包指定格式
* 支持打包前删除之前打包结果

<hr />

reactivity

* reactive(支持嵌套)
* ref(支持嵌套)
* track依赖收集
* trigger依赖触发
* readonly(支持嵌套)
* isProxy
* isReactive
* isReadonly
* isRef
* unRef
* effect.scheduler
* effect.stop

<hr />

runtime-core

* h函数
* render函数渲染HTMLElement

<hr />

- [Monorepo组织管理构建](#一monorepo组织管理构建)
    - [package.json说明](#packagejson)
    - [tsconfig.json说明](#tsconfigjson)
    - [rollup.config.mjs说明](#rollupconfigmjs)
    - [pnpm-workspace.yaml说明](#pnpm-workspaceyaml)
- [packages包](#二packages)
    - [reactivity](#reactivity)
        - [1. reactive的响应式系统整个流程](#1-reactive的响应式系统整个流程)
        - [2. 创建reactive Proxy步骤](#2-创建reactive-proxy步骤)
        - [3. effect 副作用函数收集](#3-effect-副作用函数收集)
        - [4. track依赖收集](#4-track依赖收集)
        - [5. trigger依赖触发](#5-trigger依赖触发)
    - [ref](#ref)
        - [1. ref的整个流程](#1-ref的整个流程)
    - [runtime-core](#runtimecore)

# 一、Monorepo组织管理构建

## package.json

`pnpm init`

* rollup: 构建工具rollup相关依赖
* tslib: 辅助ts的依赖
* vitest: Vite集成的测试框架
* script脚本
    * "dev": "rollup -c -w"
        * -c: 构建时用rollup.config.ts配置文件
        * -w: 监听
    * "build": "node scripts/build.mjs",
    * "test": "vitest run" 运行__test__下的所有测试文件
        * 测试文件以.test.ts或.spec.ts为后缀

    * "build:reactivity": "node scripts/build.mjs reactivity shared --formats cjs"
        * 指定模块打包
        * 支持参数
            * 直接跟包名
            * --format(-f): esm-bundler, esm-browser, cjs, global
            * --devOnly(-d): 没有参数
            * sourceMap

## tsconfig.json

`tsc --init`
typescript的配置

## rollup.config.mjs

rollup的相关配置项

## pnpm-workspace.yaml

pnpm不支持在package.json中配置的workspace字段, 需要新建名为这个的文件进行配置

# 二、packages

分包的package中buildOptions字段决定了构建的格式，优先级如下：

1. 最外层的package中build的--format(-f)参数
2. buildOptions
3. build.mjs中的initFormat

分包概述：

* reactivity 响应式系统
* share 仓库中中多个包之间共享的工具或功能模块

## reactivity 包

### reactive

#### 1. reactive的响应式系统整个流程

1. 被reactive包裹会先创建proxy, 并植入getter、setter(这里有缓存优化WeakMap, 会先找是否已经存在)
    * 会存在全局的WeakMap中, key是源对象, value是这个对象的代理.
      具体见下[2. 创建reactive Proxy步骤](#2-创建reactive-proxy步骤)
2. 创建函数后(与代理对象相关的函数), 放入effect中收集该副作用函数
    * 创建 ReactiveEffect 实例. (这一条和下一条是[3. effect 副作用函数收集](#3-effect-副作用函数收集)的内容)
    * 创建完直接触发 run() 方法, 执行一次副作用函数.
    * **上一步的执行过程中** **会触发getter**(`track方法`, 因为读取了代理的值).
      具体见下[4. track依赖收集](#4-track依赖收集)
    * 如果`isObject` 则根据`isReadonly`递归调用 readonly 或 reactive (**支持嵌套**)
    * 触发getter后返回获取到的值(`Reflect.get(target, key, receiver)`的返回值)
    * 重置`shouldTrack`和**`activeEffect`**, 目的是为了防止setter时触发的track重复收集依赖, 下面都有具体说明
    * 最后返回函数执行结果(这个就是纯纯该函数返回的结果, 和上面的getter无关)
    * effect最后使用bind修改this指向
3. 修改了代理对象, 会触发**setter**, setter中触发了`trigger方法`. 具体见下[5. trigger依赖触发](#5-trigger依赖触发)
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

#### 3. effect 副作用函数收集

1. 通过传入的 fn(副作用函数) 创建 `ReactiveEffect实例`
    * 接收两个参数, fn 和 scheduler(调度器), 如果有调度器执行的时候会执行调度器, 不执行 fn
2. 实例化之后, 调用实例对象的 `run()`, run()执行副作用函数, 会触发响应式数据的 `getter`

#### 4. track依赖收集

> 主要是第一次访问该代理, 之后触发setter -> 执行副作用函数 -> 会再次触发track, 这次的所有if()判断都会为false

依赖结构:

```text
targetMap -> 最大的依赖集合, 用来存储全部依赖收集信息
|       |
target  depsMap -> 当前target(源对象)的key对应的map
        |     |
        key   depsSet -> key对应所用到的副作用函数集合, type = Set<ReactiveEffect>
```

1. 先从 targetMap 中找到是否收集过, 没收集过就新建 depsMap
2. 再从 depsMap 中获取依赖集, 没获取到就新建 depsSet, 后将 depsSet 传入`trackEffects`中
3. 收集依赖, 判断 `activeEffect` 是否存在在 depsSet 里面, 不存在就将整个 activeEffect 加入 depsSet; 并且需要将 depsSet
   加入至 `activeEffect.deps` 里面, 以便清除依赖用

#### 5. trigger依赖触发

依赖结构: 同track

```text
targetMap -> 最大的依赖集合, 用来存储全部依赖收集信息
|       |
target  depsMap -> 当前target(源对象)的key对应的map
        |     |
        key   depsSet -> key对应所用到的副作用函数集合, type = Set<ReactiveEffect>
```

1. 从 targetMap 中获取 depsMap, 如果没有就直接return, 证明这个依赖当时判断不需要收集
2. 通过 depsMap 拿到 depsSet, 之后传给`triggerEffects`进行触发依赖. (中途的代码是为了让看的时候逻辑更加分离)
3. **执行副作用函数**, 遍历 depsSet 如果有`调度器scheduler`, 就执行 `effect.scheduler()`, 否则就执行`effect.run()`

### ref

#### 1. ref的整个流程

> ref就是相对于 reactive 多了一个 **.value** 的过程, 内部响应式依靠 reactive

1. 被ref包裹会创建`refImpl`实例,
    * 先判断是否为对象, 是对象就通过 reactive 包裹(多层就递归(reactive的逻辑))
    * 创建 dep 依赖集合 Set
2. 将副作用函数放进 effect 中收集依赖
3. effect 中的 `run()` 会触发 ref 的 getter, getter 触发 `trackRefValue()` 开始收集依赖
4. 收集完后返回 `this._value` 即响应式数据
5. 修改时, 会再次触发 `getter`, 和reactive相同, 触发的时候会跳过一系列判断(因为已经收集过)
6. 之后**触发`setter`**, 触发`trigger`， 后续步骤和 reactive 相同

## runtime-core 包

### h 流程（createVNode）

```markdown
/**

* @description 该创建虚拟节点的工厂函数
* @param {VNodeTypes} type 节点类型，可能是string(如"div")，不是string即为组件对象
* @param props 元素的属性对象，包含了一些属性名-属性值的键值对。默认为 null
* @param children 元素的子元素或者文本内容。可以是一个字符串或者一个包含多个子元素的数组。默认为空数组
* @return {VNode} vnode虚拟节点
  */
```

1. h 函数内部返回一个 `createVNode函数`，该函数的创建虚拟节点的主要函数
2. 初始化一个vnode
3. 初始化vnode时，根据 type 判断 shapeFlag，并设置到 vnode 上
    * 判断这个 vnode 是`HTMLElement`还是一个`组件`
4. 再根据 children 通过位运算来重新设置 shapeFlag
    * 供之后的 `normalizeChildren` 函数判断
5. `normalizeChildren`函数做 对 shapeFlag的进一步处理
    * 处理 children 是否为 `component`
6. 最后返回处理完的`vnode`

### render 流程

* render 分为 mount 和 update 两部分
* 主要是在 path 中做判断

#### render 的 初始化挂载(mount)流程

这里只说 mount 流程, update 时需要做diff算法，update 流程

1. 向render注入`patchProp`和`nodeOps`
    * nodeOps有：createElement, insert
    * patchProp 更新元素属性
2. 开始`path`函数

#### path流程

mount 和 update 都会调用path，区别的 mount 时候 n1 = null

**n1 和 n2 都是 vnode, 即 h 函数创建的虚拟节点**

1. 先判断 n2(新节点) 的类型，分四种(后两种根据shapeFlag判断)：

* 文本节点,调用`processText`
* Fragment, 调用`processFragment`
* HTMLElement, 调用`processElement`
* 组件, 调用`processComponent`

> 从这步开始，mount 和 update就开始有区别了，这里先说mount流程

##### 文本节点`processText`方法

##### Fragment节点`processFragment`方法

##### HTMLElement节点`processElement`方法

1. 检测到`n1 === null`，调用`mountElement`
2. 调用`hostCreateElement`(即`createElement`)，根据 vnode.type 创建一个 element(不是vnode) , 并把这个 element
   的引用给 vnode.el
3. 判断 vnode.children 节点
    * 文本，即`shapeFlag & ShapeFlags.TEXT_CHILDREN`有值，调用`hostSetElementText`
        * `hostSetElementText`(即`setElementText`): 调用`el.children = text节点;`
    * 数组，即`shapeFlag & ShapeFlags.ARRAY_CHILDREN`有值，调用`mountChildren`
        * `mountChildren`: 内部遍历children，递归调用`patch`
4. 处理props
    * 循环遍历 `node.props`, 调用`hostPathProp(el, key, null, nextVal);`
    * `hostPathProp`: 调用`patchProp: el.props[key] = nextValue;`,
5. 触发`beforeMount()`钩子
6. 处理完成，调用`hostInsert`函数（即`insert`函数），插入到 `container`内
    * 将子元素添加到父元素的子元素列表中: `parent.children.push(child);`
    * 设置子元素的父节点属性为当前父元素: `child.parentNode = parent;`