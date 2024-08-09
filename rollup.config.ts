import typescript from "@rollup/plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default {
  input:"./packages/vue/src/index.ts",
  plugins: [
    // 将环境变量替换为字符串
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
      "process.env.VUE_ENV": JSON.stringify("browser"),
      "process.env.LANGUAGE": JSON.stringify(process.env.LANGUAGE),
    }),
    resolve(),
    commonjs(),
    typescript(),
    // 源映射
    sourceMaps(),
  ],
  output: [
    {
      format: "cjs",
      file: "./packages/vue/dist/mini-vue.cjs.js",
      sourcemap: true,
    },
    {
      name: "vue",
      format: "es",
      file: "./packages/vue/dist/mini-vue.esm-bundler.js",
      sourcemap: true,
    },
  ],
  onwarn: (msg, warn) => {
    // 忽略 Circular 的错误（循环依赖）
    if (!/Circular/.test(msg)) {
      warn(msg);
    }
  },
};
