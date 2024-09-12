import path from 'path';
import ts from 'rollup-plugin-typescript2';
// import sourcemaps from 'rollup-plugin-sourcemaps'
import json from '@rollup/plugin-json';
import commonJS from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// msj不支持require和__dirname
const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 获取 packages 目录
const packagesDir = path.resolve(__dirname, 'packages');

// 获取要打包的模块
const packageDir = path.resolve(packagesDir, process.env.TARGET);

// 获取对应打包目录下的文件（这里用来取 package.json 文件）
const resolve = p => path.resolve(packageDir, p);

// 获取 package.json
const pkg = require(resolve(`package.json`));

// 获取在 package.json 中，自定义的属性 buildOptions
const packageOptions = pkg.buildOptions || {};

// 获取文件名
const name = packageOptions.filename || path.basename(packageDir);

// 一个关于代码格式的映射表，用于确定打包的代码格式和文件名
const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${ name }.esm-bundler.js`), // 打包后的文件
    format: `es`, // 采用的代码格式
  },
  'esm-browser': {
    file: resolve(`dist/${ name }.esm-browser.js`),
    format: `es`,
  },
  cjs: {
    file: resolve(`dist/${ name }.cjs.js`),
    format: `cjs`,
  },
  global: {
    file: resolve(`dist/${ name }.global.js`),
    format: `iife`, // 立即执行函数
  },
};

// 获取 formats，代码打包格式
const defaultFormats = ['esm-bundler', 'cjs']; // 默认 formats
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(','); // 环境变量中的 formats
const inlineSourcemap = process.env.SOURCE_MAP;
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats;
const packageSourceMap = inlineSourcemap || 'true';

// 循环调用 createConfig 处理 formats 中的所有代码格式
const packageConfigs = packageFormats.map(format => createConfig(format, outputConfigs[format],));

// 导出配置
export default packageConfigs;

function createConfig(format, output, sourceMap) {
  // 如果是全局模式，则需要配置全局变量名
  const isGlobalBuild = /global/.test(format);
  if (isGlobalBuild) {
    output.name = packageOptions.name;
  }

  output.sourcemap = sourceMap; // 生成映射文件

  // 生成rollup 配置
  return {
    input: resolve('src/index.ts'), // 入口
    output, // 出口
    plugins: [
      // 插件是自上而下执行
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.VUE_ENV': JSON.stringify('browser'),
        'process.env.LANGUAGE': JSON.stringify(process.env.LANGUAGE),
      }),
      json(),
      ts({
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      }),
      commonJS({
        sourceMap: false,
      }),
      nodeResolve(),
      terser(),
      // sourcemaps(),
    ],
  };
}
