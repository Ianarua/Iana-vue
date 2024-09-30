export function emit(instance, event: string, ...rawArgs) {
  // 1. emit 基于 props 里面的 onXXX 函数进行匹配
  // 先从 props 中查看是否有对应的 event handler
  const props = instance.props;
  // eg: event -> click 那么这里就是onClick
  // kebab-case命名需要： change-page -> changePage
  let handler = props[toHandlerKey(camelize(event))];

  // 如果上面没有匹配到，那就检测一下 event 是不是 kebab-case 类型
  if (!handler) {
    handler = props[toHandlerKey(hyphenate(event))];
  }

  if (handler) {
    handler(...rawArgs);
  }
}