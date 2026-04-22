/**
 * @module utils/async
 * @description 异步工具函数
 * 
 * 提供 Promise 错误处理的优雅方案，
 * 将 try/catch 模式转换为更简洁的数组解构模式。
 * 
 * 设计灵感来自 Go 语言的错误处理风格：
 * - 成功时返回 [null, data]
 * - 失败时返回 [error, null]
 * 
 * @example
 * // 传统写法
 * try {
 *   const result = await api.getData()
 *   console.log(result)
 * } catch (err) {
 *   console.error(err)
 * }
 * 
 * // 使用 to() 的写法
 * const [err, data] = await to(api.getData())
 * if (err) { console.error(err); return }
 * console.log(data)
 */

/**
 * 将 Promise 转换为 [error, data] 元组格式
 * 
 * 统一异步操作的错误处理方式，避免大量 try/catch 嵌套。
 * 特别适用于连续多个异步操作的场景。
 * 
 * @param {Promise} promise - 要包装的 Promise 对象
 * @returns {Promise<Array>} 元组 [error, data]
 *   - 成功: [null, data]
 *   - 失败: [error, null]
 * 
 * @example
 * const [err, user] = await to(userApi.login({ username, password }))
 * if (err) {
 *   ElMessage.error(err.message)
 *   return
 * }
 * currentUser.value = user
 */
const to = (promise) => promise.then((data) => [null, data]).catch((err) => [err, null])

export { to }
