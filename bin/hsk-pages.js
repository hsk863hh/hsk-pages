#!/usr/bin/env node

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) // --gulpfile .. 会去 package.json 文件找main字段
// process.argv.push(require.resolve('../lib/index.js')) // 也可以直接指定到

require('gulp/bin/gulp')