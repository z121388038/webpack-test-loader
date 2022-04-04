# webpack5实现自定义plugins

[文档地址: https://juejin.cn/post/7082480895881379847](https://juejin.cn/post/7082480895881379847)

[项目源代码传送门](https://gitee.com/zhigangzhang1/webpack-test-loader)

[plugins相关文档地址：https://webpack.docschina.org/api/plugins](https://webpack.docschina.org/api/plugins)

### 插件介绍
使用阶段式的构建回调，我们可以在webpack构建流程中引入一些自定义的流程。

**webpack插件由以下几个部分组成：**
- 一个 `class` 类
- 给这个类添加 `apply` 方法，以 `compiler` 为参数
- 指定一个绑定到 `webpack` 自身的[事件钩子](https://webpack.docschina.org/api/compiler-hooks/)
- 处理 `webpack` 内部实例的特定数据
- 功能完成后调用 `webpack` 提供的回调

```javascript
// class 类
class MyPlugins {
    constructor() {
        console.log('MyPlugins init')
    }

    // 在插件函数的 prototype 上定义一个 `apply` 方法，以 compiler 为参数。
    apply(compiler) {
        compiler.hooks.emit.tapAsync('MyPlugins', (compilation, callback) => {
            console.log('这是一个插件的emit tapAsync 示例')
            console.log('这里表示了资源的单次构建的 `compilation` 对象：', compilation)

            // 用 webpack 提供的插件 API 处理构建过程
            compilation.addModule(/* ... */);

            callback()
        })
    }
}
```

根据使用不同的钩子( `hooks` )和 `tap` 方法，插件可以以多种不同的方式运行，这个工作方式以 `Tapable` 提供的 [钩子(hooks)](https://github.com/webpack/tapable#tapable) 密切相关， [compiler hooks](https://webpack.docschina.org/api/compiler-hooks/#hooks) 分别记录了 `Tapable` 内在的钩子，并指出哪些 `tap` 可以用。

**所以依赖于与使用 `tap` 方法的不同，插件可能会以不同的方式运行。** 例如:

- 钩入到 `编译(compile)` 阶段时，只有同步的 `tap` 方法可以使用
  ```javascript
  compiler.hooks.compile.tap('MyPlugin', () => {
    console.log('以同步的方式触及 compile 钩子')
  })
  ```
- `run` 阶段时，就需要使用 `tapAsync` 、 `tapPromise` 、 `tap` 方法 
  ```javascript
        compiler.hooks.run.tapAsync('MyPlugin', (source, target, routesList, callback) => {
            console.log('以异步方式触及运行钩子。');
            callback();
        })

        compiler.hooks.run.tapPromise('MyPlugin', (source, target, routesList) => {
            return new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
                console.log('以异步的方式触发具有延迟操作的钩子。');
            });
        });

        compiler.hooks.run.tapPromise(
            'MyPlugin',
            async (source, target, routesList) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                console.log('以异步的方式触发具有延迟操作的钩子。');
            }
        );
  ```







### 具体如何实现一个自定义插件

我们现在正式开始来实现一个自定义的插件，该插件主要功能就是生成一个资源列表的.md文件

我们接着上一期 [如何实现自定义loader的代码继续增加](https://juejin.cn/post/7082480895881379847)

首先我们在项目根目录增加plugins目录，在该目录下面新建 `create-file-md.js` 文件，代码如下：

```javascript
// create-file-md.js

class CreateFileMd {

    constructor(options={}) {
        console.log('createFileMd init')
    }

    // 在插件函数的 prototype 上定义一个 `apply` 方法，以 compiler 为参数。
    apply(compiler) {
    }
}

module.exports = CreateFileMd
```

然后我们在 `webpack.config.js` 里面使用该插件， 代码如下：
```javascript
// webpack.config.js

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CreateFileMd = require('./plugins/create-file-md')

module.exports = {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolveLoader: {
        modules: ['node_modules', './loader']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    { loader: 'babel-loader' },
                    {
                        loader: 'async',
                        options: {
                            showCompileTime: true
                        }
                    },
                    {
                        loader: 'sync',
                        options: {
                            showCopyright: true
                        }
                    },
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: 'body',           //script标签的放置
            title: 'webpack5自定义loader',
            // minify: {                       //html压缩
            //     removeComments: true,       //移除注释
            //     collapseWhitespace: true    //移除空格
            // }
        }),

        new CreateFileMd()
    ]
}
```

插件的核心就在于 `apply` 方法执行时， 可以根据 `compiler` 和 `compilation` 每个不同的时期(也就是 `hooks` 或者说生命周期)，干一些你相干的事情。

`webpack hooks` 可参考 [文档地址](https://webpack.docschina.org/api/compiler-hooks/#hooks)

**敲黑白了**，前面我们已经说了hooks有同步和异步的区分，一定要注意哦

接下来我们就来给 `CreateFileMd` 这个类增加生成fileList.md的功能，代码如下：

```javascript
// create-file-md.js

class CreateFileMd {

    static defaultOptions = {
        outputFile: 'file-list.md'
    }

    constructor(options={}) {
        console.log('createFileMd init')

        // 合并options参数暴露给插件方法
        // 这里可以做options参数验证， 可使用schema-utils资源包的validate方法 验证
        this.options = { ...CreateFileMd.defaultOptions, ...options }
    }

    // 在插件函数的 prototype 上定义一个 `apply` 方法，以 compiler 为参数。
    apply(compiler) {
        const pluginName = CreateFileMd.name

        // webpack 模块实例，可以通过 compiler 对象访问，
        // 这样确保使用的是模块的正确版本
        // （不要直接 require/import webpack）
        const { webpack } = compiler

        // Compilation 对象提供了对一些有用常量的访问。
        const { Compilation } = webpack

        // RawSource 是其中一种 “源码”("sources") 类型，
        // 用来在 compilation 中表示资源的源码
        const { RawSource } = webpack.sources

        // 绑定到 “thisCompilation” 钩子，以便进一步绑定到 compilation 过程更早期的阶段
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            // 绑定到资源处理流水线(assets processing pipeline)
            compilation.hooks.processAssets.tap({ name: pluginName, stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE}, (assets) => {

                // 遍历所有资源，生成 Markdown 文件的内容
                const content = Object.keys(assets).map((fileName) => `- ${fileName}`).join('\n')
                console.log(content)

                // 向 compilation 添加新的资源，这样 webpack 就会自动生成并输出到 output 目录
                compilation.emitAsset( this.options.outputFile, new RawSource(content) );
            })
        })
    }
}

module.exports = CreateFileMd
```

最后我们执行 `npx webpack` 查看一下发现每次编译之后就会自动帮我们生成file-list.md文件了

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a975a576a55646bf9e7f228235b209d4~tplv-k3u1fbpfcp-watermark.image?)
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c1e9fd0138044403a1ea4edff7605c73~tplv-k3u1fbpfcp-watermark.image?)

至此，我们就介绍了如何实现一个自定义plugins





