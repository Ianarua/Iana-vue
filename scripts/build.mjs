import fs from 'fs';
import { execa } from 'execa'; // 用于开启子进程, 使用rollup打包
import { rimraf } from 'rimraf';  // 清除dist

import minimist from 'minimist';
import { createRequire } from 'module';

/**
 * minimist 能够解析命令行中的参数，并将它们放在一个普通对象中返回
 * 例如，node scripts/dev.js reactivity -formats global  会被解析为：
 * { _: [ 'reactivity' ], formats: 'global' }
 */
const args = minimist(process.argv.slice(2)); // 解析命令行参数

const argsTargets = args._;
const formats = args.formats || args.f; // 代码格式
const devOnly = args.devOnly || args.d; // 用于控制打包环境
const sourceMap = args.sourcemap || args.s; // 是否生成映射文件

const require = createRequire(import.meta.url);

// 所有模块
const targets = argsTargets || fs.readdirSync('packages').filter(f => {
  // 不是文件夹，就过滤掉
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false;
  }
  // 文件夹（模块）下的 package.json，若是其 private 为真，但 buildOptions 不存在，就过滤掉
  const pkg = require(`../packages/${f}/package.json`);
  if (pkg.private && !pkg.buildOptions) {
    return false;
  }

  return true;
});

// 并行打包前先清除 dist 目录
targets.forEach(target => cleanDist(target));

runParallel(targets, build).then(() => {
  console.log();
  console.log(`\x1b[32m%s\x1b[0m`,'--------全部打包完成😁--------');
});

// 清除 dist 目录的函数
function cleanDist(target) {
  const distPath = `packages/${target}/dist`;
  if (fs.existsSync(distPath)) {
    rimraf.sync(distPath);
    console.log(`Cleaned existing dist directory: ${distPath}`);
  }
  fs.mkdirSync(distPath, { recursive: true });
  console.log(`Created fresh dist directory: ${distPath}`);
}


// 通过 Promise.all 实现并行打包
async function runParallel(source, iteratorFn) {
  const ret = [];
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source));
    ret.push(p);
  }
  return Promise.all(ret);
}

// 打包
async function build(target) {
  const env = devOnly ? 'development' : 'production';

  // -c 表示使用配置文件 rollup.config.js 打包
  // –environment 设置需要传递到文件中的环境变量，例如，NODE_ENV、TARGET
  // 这些变量可以在 js 文件中，通过 process.env 读取，例如，process.env.TARGET
  await execa(
    'rollup', // 执行命令
    [
      '-c',
      '--environment',
      [
        `NODE_ENV:${env}`, // 这个数组里面全是 环境变量
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``
      ].filter(Boolean).join(',') // filter(Boolean) 会排除假值
    ],
    { stdio: 'inherit' } // 子进程打包的信息 共享 给父进程
  );
}
