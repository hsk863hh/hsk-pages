const { src, dest, parallel, series, watch } = require('gulp');

const del = require('del');
const browser = require('browser-sync');

const loadPlugins = require('gulp-load-plugins');

const plugins = loadPlugins()
const bs = browser.create()
const cwd = process.cwd()

let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig)
} catch(e) {}

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src}) // 配置了base，会安装配置的路径去写入（从src下一层级开始，生成相同的路径）
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))  
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({ stream: true }))
} 

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch( config.build.paths.styles, { cwd: config.build.src }, style)
  watch( config.build.paths.scripts, { cwd: config.build.src }, script)
  watch( config.build.paths.pages, { cwd: config.build.src }, page)
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, // 页面更新又上角有小提示，false就没有了
    port: 2080, // 端口
    // open: false, // false 就不会自动打开浏览器了
    // files: 'dist/**',  // 需要监听的文件，可使用通配符*
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules' //对bootstrap库的请求重定向到项目下的node_modules
      }
    }
  })
} 

const useref = () => {
  return src(config.build.paths.pages, {base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({searchPath: [config.build.dist, '.']}))
    .pipe(plugins.if(/\.js$/,plugins.uglify()))
    .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/,plugins.htmlmin({ 
      collapseWhitespace: true, // 去除html文件的空格
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
} 

const compile = parallel(style,script,page)

// 上线之前执行的任务
const build = series(
  clean, 
  parallel(
    series(compile,useref),
    image,
    font,
    extra
  )
)

const dev = series(compile, serve)

module.exports = {
  clean,
  build,
  dev
}