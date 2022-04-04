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
