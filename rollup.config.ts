// @ts-check
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonJS from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { createRequire } from 'node:module';
import { specifyOutputPath } from './scripts/packages';

type PackageFormat = 'cjs' | 'esm-bundler' | 'global' | 'esm-browser';
type MarkRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
type OutputOptions = MarkRequired<import('rollup').OutputOptions, 'file' | 'format'>

const require = createRequire(import.meta.url);

const __dirname = path.resolve();
const packagesDir = path.resolve(__dirname, 'packages');

const rootPath = specifyOutputPath('root-dist');

/**
 *
 * @param {string} p - package name
 * @returns
 */
const resolve = (p: string) => path.resolve(packagesDir, p);

/**
 * @param {string} target
 * @returns {Record<PackageFormat, OutputOptions>}
 */
const outputConfigs = (target: string): Record<PackageFormat, OutputOptions> => ({
  'esm-bundler': {
    file: `${ rootPath(target) }${ target }.esm-bundler.js`,
    format: 'esm',
  },
  'esm-browser': {
    file: `${ rootPath(target) }${ target }.esm-browser.js`,
    format: 'esm',
  },
  cjs: {
    file: `${ rootPath(target) }${ target }.cjs.js`,
    format: 'cjs',
  },
  global: {
    file: `${ rootPath(target) }${ target }.global.js`,
    format: 'iife',
  },
});

/**
 *
 * @param {string} target
 * @param {PackageFormat} format
 * @param {OutputOptions} output
 * @param {ReadonlyArray<import('rollup').Plugin>} plugins
 * @param {boolean} sourcemap
 * @returns
 */
function createConfig(
  target: string,
  format: PackageFormat,
  output: OutputOptions,
  plugins: ReadonlyArray<import('rollup').Plugin> = [],
  sourcemap: boolean = false,
) {
  if (!output) {
    // csl.yellow(`invalid format: "${format}"`)
    console.warn(`invalid format: "${ format }"`);
    process.exit(1);
  }

  const pkg = require(resolve(`${ target }/package.json`));

  const isBundlerESMBuild = /esm-bundler/.test(format);
  const isBrowserESMBuild = /esm-browser/.test(format);
  const isCJSBuild = format === 'cjs';
  const isGlobalBuild = /global/.test(format);
  const isCompatPackage = false;

  output.exports = isCompatPackage ? 'auto' : 'named';
  if (isCJSBuild) {
    output.esModule = true;
  }
  output.sourcemap = sourcemap;
  output.externalLiveBindings = false;
  if (isGlobalBuild) {
    output.name = pkg.name;
  }

  let entryFile = `src/${ target }.js`;

  if (isCompatPackage && (isBrowserESMBuild || isBundlerESMBuild)) {
    entryFile = `src/esm-${ target }.js`;
  }

  function resolveExternal() {
    const treeShakenDeps = [
      'source-map-js',
      '@babel/parser',
      'estree-walker',
      // 'entities/lib/decode.js',
    ];

    return [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      // for @vue/compiler-sfc / server-renderer
      ...['path', 'url', 'stream'],
      ...treeShakenDeps,
    ];
  }

  function resolveNodePlugins() {
    // we are bundling forked consolidate.js in compiler-sfc which dynamically
    // requires a ton of template engines which should be ignored.
    /** @type {ReadonlyArray<string>} */
    let cjsIgnores = [];
    // if (pkg.name === '@xj-fv/shared') {}

    const nodePlugins =
      format === 'cjs' && Object.keys(pkg.devDependencies || {}).length
        ? [
          commonJS({
            sourceMap: false,
            ignore: cjsIgnores,
          }),
          nodeResolve(),
        ]
        : [];

    return nodePlugins;
  }

  return {
    input: `/packages/${ target }/src/index.js`,
    external: resolveExternal(),
    output,
    plugins: [
      resolveNodePlugins(),
      ...plugins,
    ],
    onwarn(msg, warn) {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
  };
}

function createProductionConfig(target, /** @type {PackageFormat} */ format) {
  return createConfig(target, format, {
    file: resolve(`dist/${ target }.${ format }.prod.js`),
    format: outputConfigs(target)[format].format,
  });
}

function createMinifiedConfig(target, /** @type {PackageFormat} */ format) {
  return createConfig(
    target,
    format,
    {
      file: outputConfigs(target)[format].file.replace(/\.js$/, '.prod.js'),
      format: outputConfigs(target)[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2016,
          pure_getters: true,
        },
        safari10: true,
      }),
    ],
  );
}

export {
  createConfig,
  createProductionConfig,
  createMinifiedConfig,
  outputConfigs,
};