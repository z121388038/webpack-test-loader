import { queryParse, getQueryStringify } from './utils'
import getTime from './get-time'

console.log('queryParse：', queryParse('name=张三&age=28'))
console.log('getQueryStringify：', getQueryStringify({name: '李四', age: 33 }))
console.log('getTime：', getTime())
