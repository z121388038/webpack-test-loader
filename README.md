# webpack-test-loader

### 介绍
webpack5实现自定义loader

文章地址： https://juejin.cn/post/7082480895881379847

loader相关文档地址：https://webpack.docschina.org/api/loaders/

### 初始化项目

首先我们初始化一个项目

然后执行`npm init -y` 创建`package.json`

目录结构如下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1c38635df88343498ca758a6226ed2c1~tplv-k3u1fbpfcp-watermark.image?)

文件内容如下：
```javascript
// get-time.js
export default () => {
    return new Date()
}

// utils.js
const queryParse = query => {
    const result = {};
    if (query) {
        decodeURIComponent(query)
            .split('&')
            .map(v => v.split('='))
            .forEach(v => {
                result[v[0]] = v[1];
            });
    }
    return result;
};

const getQueryStringify = (query = {}) => {
    const keys = Object.keys(query);
    if (!query || !keys.length) return '';

    return keys.map(key => `${key}=${query[key]}`).join('&');
};

module.exports = { queryParse, getQueryStringify }

// index.js
import { queryParse, getQueryStringify } from './utils'
import getTime from './get-time'

console.log('queryParse：', queryParse('name=张三&age=28'))
console.log('getQueryStringify：', getQueryStringify({name: '李四', age: 33 }))
console.log('getTime：', getTime())
```
```html
<!--index.html-->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= htmlWebpackPlugin.options.title %></title>
</head>
<body>

</body>
</html>
```
```javascript
// webpack.config.js
const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
}
```

### webpack的基本配置
1、安装依赖包

- webpack
    - webpack-cli
    - html-webpack-plugin
    - babel-loader
    - babel-loader
    - @babel/core

```js
// babel-loader和@babel/core分开装的，我一起装的话执行会报错，可能是版本对不上
npm install webpack webpack-cli html-webpack-plugin babel-loader --save-dev
npm install @babel/core --save-dev
```
2. 然后给webpack.config添加基本的loader、plugin
```
// webpack.config.js

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /.js$/,
                loader: 'babel-loader'
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
        })
    ]
}
```
然后执行`npx webpack`之后如下

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44a2a2c28d634e5584111c9abb6f0f77~tplv-k3u1fbpfcp-watermark.image?)

点击dist里面的index.html查看如下，我们发现title修改了，main.js自动帮我们引入了

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/81968c1a185d45e081a643d399012fd1~tplv-k3u1fbpfcp-watermark.image?)

### 实现一个自定义的同步loader
在项目根目录创建目录loader，然后进入loader目录新建`sync.js`文件
```
// sync.js

// 注意：同步和异步都不能用箭头函数方式，因为会改变this指向为undefined
module.exports = function (content, map, meta) {
    console.log('content：', content)


    // this.callback比直接return content 方法则更灵活，因为它允许传递多个参数，而不仅仅是 content。
    this.callback(null, content, map, meta)
    // return content
}
```
同时，我们在`webpack.config.js`中使用这个`loader`，

这里使用`resolveLoader`配置项，指定`loader`查找文件路径，这样我们使用loader的时候可以直接指定loader的名字，不用带loader的具体的路径

同时匹配到`.js`文件同时使用多个loader，所以`/.js$/`修改为用use[]的写法，代码如下：

```
// webpack.config.js

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

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
                test: /.js$/,
                use: [
                    { loader: 'babel-loader' },
                    {
                        loader: 'sync',
                        options: {
                            showCopyright: true
                        }
                    }
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
        })
    ]
}
```

接着我们给loader加一个功能：给匹配到的`js`文件根据`loader`的`options`判断是否添加一行`console.log('这里可以是作者的名字啊');`

```
// sync.js
// 注意：同步和异步都不能用箭头函数方式，因为会改变this指向为undefined
module.exports = function (content, map, meta) {
    console.log('content：', content)
    // 获取配置的options, webpack5版本自带，老版本需要用loader-utils来获取
    const { showCopyright } = this.getOptions()

    // 自动给文件添加copyright的功能
    if(showCopyright) {
        content = `console.log('这里可以是作者的名字啊');\n${content}`
    }
    console.log(content)
    // this.callback比直接return content 方法则更灵活，因为它允许传递多个参数，而不仅仅是 content。
    this.callback(null, content, map, meta)
    // return content
}
```
我们再次执行`npx webpack`，打包后的代码如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/843ced2fe8734fbab2af45ef627ee831~tplv-k3u1fbpfcp-watermark.image?)

然后用浏览器打开dist里面的index.html文件，发现三个js文件也都打印出来了这行信息

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3663b7fe2d01490daaa18d1ba7973156~tplv-k3u1fbpfcp-watermark.image?)

至此，我们就实现了一个简单的给`.js`文件添加信息的loader

### 实现一个自定义的异步loader

和同步的方式基本差不多，异步的loader，使用是的 [`this.async`](https://webpack.docschina.org/api/loaders/#thisasync) 来获取 `callback` 函数：

我们在`src/loader`下面新建`async.js`

```
// async.js

// 注意：同步和异步都不能用箭头函数方式，因为会改变this指向为undefined
module.exports = function (content, map, meta) {
    var callback = this.async();
    // 获取配置的options, webpack5版本自带，老版本需要用loader-utils来获取
    const { showCompileTime } = this.getOptions()

    // 自动给文件添加copyright的功能
    if(showCompileTime) {
        content = `// 项目编译时间：${new Date()}\n${content}`
    }
    console.log(content)
    callback(null, content, map, meta)
}
```

然后在`webpack.config.js`里面使用`async`这个loader
```
// webpack.config.js

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

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
                test: /.js$/,
                use: [
                    { loader: 'babel-loader' },
                    {
                        loader: 'sync',
                        options: {
                            showCopyright: true
                        }
                    },
                    {
                        loader: 'async',
                        options: {
                            showCompileTime: true
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
        })
    ]
}
```

至此我们就介绍了如何实现`自定义同步、异步`的`loader`

### loader从下往上解析
文章最后说明一下：`webpack内loader的执行是从下往上的解析的`






