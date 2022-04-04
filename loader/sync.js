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
