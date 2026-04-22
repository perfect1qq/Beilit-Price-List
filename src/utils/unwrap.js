/**
 * @module utils/unwrap
 * @description API 响应数据提取工具
 * 
 * 将 axios 响应的 res.data 自动提取出来，
 * 避免在每个调用处手动解构 response.data。
 * 
 * @example
 * // 使用前：需要手动取 .data
 * const res = await request.get('/api/users')
 * console.log(res.data)
 * 
 * // 使用后：直接拿到 data
 * const users = await userApi.list()
 */

const unwrap = (fn) => (...args) => fn(...args).then((res) => res.data)

export { unwrap }
