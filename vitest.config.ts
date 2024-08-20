import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // 允许使用全局的测试函数，例如 `describe`, `it`, `expect` 等
    globals: true,
  },
  resolve: {
    // 引入别名，将@iana-vue后面的提取并放到下面
    alias: [
      {
        find: /@iana-vue\/([\w-]*)/,
        replacement: path.resolve(__dirname, "packages") + "/$1/src",
      },
    ],
  },
});
