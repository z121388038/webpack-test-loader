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


