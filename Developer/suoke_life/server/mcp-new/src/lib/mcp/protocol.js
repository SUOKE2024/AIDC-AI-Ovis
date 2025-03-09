/**
 * Model Context Protocol (MCP) 核心协议定义
 * 提供模型上下文交互的标准化接口
 */

const { v4: uuidv4 } = require('uuid')
const logger = require('../../services/loggerService')

/**
 * MCP协议版本
 */
const MCP_VERSION = '1.0.0'

/**
 * MCP资源类型枚举
 */
const ResourceType = {
  KNOWLEDGE_BASE: 'knowledge_base',
  DATA_SOURCE: 'data_source',
  SERVICE: 'service',
  MODEL: 'model',
  SYSTEM: 'system'
}

/**
 * MCP操作结果状态枚举
 */
const StatusCode = {
  SUCCESS: 'success',
  ERROR: 'error',
  AUTH_REQUIRED: 'auth_required',
  PERMISSION_DENIED: 'permission_denied',
  NOT_FOUND: 'not_found',
  BAD_REQUEST: 'bad_request',
  SERVER_ERROR: 'server_error'
}

const DataType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  BINARY: 'binary',
  JSON: 'json',
  VECTOR: 'vector',
  MULTIMODAL: 'multimodal'
}

/**
 * MCP资源定义
 * 表示一个可以被访问的资源
 */
class MCPResource {
  /**
   * 资源ID
   * @type {string}
   */
  id

  /**
   * 资源类型
   * @type {string}
   */
  type

  /**
   * 资源名称
   * @type {string}
   */
  name

  /**
   * 资源描述
   * @type {string}
   */
  description

  /**
   * 资源版本
   * @type {string}
   */
  version

  /**
   * 资源支持的操作
   * @type {Object.<string, Object>}
   */
  actions

  /**
   * 创建MCP资源
   * @param {Object} options - 资源选项
   * @param {string} options.id - 资源ID
   * @param {string} options.type - 资源类型
   * @param {string} options.name - 资源名称
   * @param {string} options.description - 资源描述
   * @param {string} options.version - 资源版本
   */
  constructor (options) {
    this.id = options.id
    this.type = options.type
    this.name = options.name || options.id
    this.description = options.description || ''
    this.version = options.version || '1.0.0'
    this.actions = {}
  }

  /**
   * 添加资源操作
   * @param {Object} action - 操作定义
   * @param {string} action.id - 操作ID
   * @param {string} action.name - 操作名称
   * @param {string} action.description - 操作描述
   * @param {Object} action.params - 操作参数定义
   * @param {Object} [action.returns] - 操作返回值定义
   * @returns {MCPResource} - 返回资源实例以支持链式调用
   */
  addAction (action) {
    if (!action.id) {
      throw new Error('Action must have an id')
    }
    this.actions[action.id] = {
      id: action.id,
      name: action.name || action.id,
      description: action.description || '',
      params: action.params || {},
      returns: action.returns || { type: 'any' },
      dataType: action.dataType || DataType.JSON
    }
    return this
  }

  /**
   * 获取操作定义
   * @param {string} actionId - 操作ID
   * @returns {Object|null} - 操作定义或null
   */
  getAction (actionId) {
    return this.actions[actionId] || null
  }

  /**
   * 验证操作参数
   * @param {string} actionId - 操作ID
   * @param {Object} params - 参数对象
   * @returns {Object} - 验证结果 {valid: boolean, errors: Array}
   */
  validateActionParams (actionId, params) {
    const action = this.getAction(actionId)
    if (!action) {
      return {
        valid: false,
        errors: [`Action '${actionId}' not found`]
      }
    }

    const errors = []
    const result = { valid: true, errors }

    // 检查必需参数
    for (const [paramName, paramDef] of Object.entries(action.params)) {
      if (paramDef.required && (params[paramName] === undefined || params[paramName] === null)) {
        errors.push(`Required parameter '${paramName}' is missing`)
        result.valid = false
      }
    }

    // 检查参数类型
    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramDef = action.params[paramName]
      if (!paramDef) {
        errors.push(`Unknown parameter '${paramName}'`)
        continue
      }

      // 类型检查
      if (paramDef.type && !this._checkType(paramValue, paramDef.type)) {
        errors.push(`Parameter '${paramName}' should be of type '${paramDef.type}'`)
        result.valid = false
      }
    }

    return result
  }

  /**
   * 检查值是否符合类型
   * @private
   * @param {any} value - 要检查的值
   * @param {string} type - 类型名称
   * @returns {boolean} - 是否符合类型
   */
  _checkType (value, type) {
    switch (type) {
      case 'string': return typeof value === 'string'
      case 'number': return typeof value === 'number'
      case 'boolean': return typeof value === 'boolean'
      case 'object': return typeof value === 'object' && value !== null
      case 'array': return Array.isArray(value)
      case 'any': return true
      default: return true // 未知类型默认通过
    }
  }

  /**
   * 转换为JSON对象
   * @returns {Object} - JSON对象表示
   */
  toJSON () {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      version: this.version,
      actions: Object.values(this.actions).map(action => ({
        id: action.id,
        name: action.name,
        description: action.description,
        params: action.params,
        returns: action.returns,
        dataType: action.dataType
      }))
    }
  }
}

/**
 * MCP请求
 * 表示对资源的操作请求
 */
class MCPRequest {
  /**
   * 创建MCP请求
   * @param {Object} options - 请求选项
   * @param {string} options.resourceId - 资源ID
   * @param {string} options.actionId - 操作ID
   * @param {Object} options.params - 操作参数
   * @param {string} [options.requestId] - 请求ID，如不提供则自动生成
   * @param {string} [options.userId] - 用户ID
   */
  constructor (options) {
    this.resourceId = options.resourceId
    this.actionId = options.actionId
    this.params = options.params || {}
    this.requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.userId = options.userId || null
    this.timestamp = Date.now()
  }

  /**
   * 转换为JSON对象
   * @returns {Object} - JSON对象表示
   */
  toJSON () {
    return {
      type: 'request',
      resourceId: this.resourceId,
      actionId: this.actionId,
      params: this.params,
      requestId: this.requestId,
      userId: this.userId,
      timestamp: this.timestamp
    }
  }
}

/**
 * MCP响应
 * 表示对请求的响应
 */
class MCPResponse {
  /**
   * 创建MCP响应
   * @param {Object} options - 响应选项
   * @param {MCPRequest|Object} options.request - 原始请求
   * @param {any} options.result - 响应结果
   * @param {string} options.status - 状态码
   * @param {string} [options.message] - 响应消息
   */
  constructor (options) {
    this.requestId = options.request.requestId
    this.resourceId = options.request.resourceId
    this.actionId = options.request.actionId
    this.result = options.result
    this.status = options.status || StatusCode.SUCCESS
    this.message = options.message || ''
    this.timestamp = Date.now()
  }

  /**
   * 转换为JSON对象
   * @returns {Object} - JSON对象表示
   */
  toJSON () {
    return {
      type: 'response',
      requestId: this.requestId,
      resourceId: this.resourceId,
      actionId: this.actionId,
      result: this.result,
      status: this.status,
      message: this.message,
      timestamp: this.timestamp
    }
  }

  /**
   * 创建成功响应
   * @param {MCPRequest|Object} request - 原始请求
   * @param {any} result - 响应结果
   * @returns {MCPResponse} - 成功响应
   */
  static success (request, result) {
    return new MCPResponse({
      request,
      result,
      status: StatusCode.SUCCESS
    })
  }

  /**
   * 创建错误响应
   * @param {MCPRequest|Object} request - 原始请求
   * @param {string} message - 错误消息
   * @param {string} [status=StatusCode.ERROR] - 状态码
   * @returns {MCPResponse} - 错误响应
   */
  static error (request, message, status = StatusCode.ERROR) {
    return new MCPResponse({
      request,
      result: null,
      status,
      message
    })
  }
}

/**
 * MCP资源注册表
 * 管理所有可用的MCP资源
 */
class MCPRegistry {
  constructor () {
    this.resources = new Map()
  }

  /**
   * 注册资源
   * @param {MCPResource} resource - 要注册的资源
   * @returns {boolean} - 是否注册成功
   */
  registerResource (resource) {
    if (!(resource instanceof MCPResource)) {
      throw new Error('Resource must be an instance of MCPResource')
    }

    if (this.resources.has(resource.id)) {
      return false
    }

    this.resources.set(resource.id, resource)
    return true
  }

  /**
   * 取消注册资源
   * @param {string} resourceId - 资源ID
   * @returns {boolean} - 是否取消注册成功
   */
  unregisterResource (resourceId) {
    if (!this.resources.has(resourceId)) {
      return false
    }

    this.resources.delete(resourceId)
    return true
  }

  /**
   * 获取资源
   * @param {string} resourceId - 资源ID
   * @returns {MCPResource|null} - 资源或null
   */
  getResource (resourceId) {
    return this.resources.get(resourceId) || null
  }

  /**
   * 获取所有资源
   * @returns {MCPResource[]} - 资源数组
   */
  getAllResources () {
    return Array.from(this.resources.values())
  }

  /**
   * 按类型获取资源
   * @param {string} type - 资源类型
   * @returns {MCPResource[]} - 资源数组
   */
  getResourcesByType (type) {
    return this.getAllResources().filter(resource => resource.type === type)
  }
}

/**
 * MCP处理器
 * 处理对资源的请求
 */
class MCPProcessor {
  /**
   * 创建MCP处理器
   * @param {MCPRegistry} registry - 资源注册表
   */
  constructor (registry) {
    if (!(registry instanceof MCPRegistry)) {
      throw new Error('Registry must be an instance of MCPRegistry')
    }

    this.registry = registry
    this.handlers = new Map()
  }

  /**
   * 注册操作处理器
   * @param {string} resourceId - 资源ID
   * @param {string} actionId - 操作ID
   * @param {Function} handler - 处理函数，接收 (params, userId) 参数，返回处理结果
   * @returns {boolean} - 是否注册成功
   */
  registerHandler (resourceId, actionId, handler) {
    const resource = this.registry.getResource(resourceId)
    if (!resource) {
      return false
    }

    const action = resource.getAction(actionId)
    if (!action) {
      return false
    }

    const key = `${resourceId}:${actionId}`
    this.handlers.set(key, handler)
    return true
  }

  /**
   * 批量注册操作处理器
   * @param {string} resourceId - 资源ID
   * @param {Object.<string, Function>} handlers - 操作ID到处理函数的映射
   * @returns {number} - 成功注册的处理器数量
   */
  registerHandlers (resourceId, handlers) {
    let count = 0
    for (const [actionId, handler] of Object.entries(handlers)) {
      if (this.registerHandler(resourceId, actionId, handler)) {
        count++
      }
    }
    return count
  }

  /**
   * 处理请求
   * @param {MCPRequest|Object} request - 请求对象
   * @returns {Promise<MCPResponse>} - 响应对象
   */
  async processRequest (request) {
    // 确保请求是MCPRequest实例
    if (!(request instanceof MCPRequest)) {
      request = new MCPRequest(request)
    }

    const { resourceId, actionId, params, userId } = request

    // 获取资源
    const resource = this.registry.getResource(resourceId)
    if (!resource) {
      return MCPResponse.error(request, `Resource '${resourceId}' not found`, StatusCode.NOT_FOUND)
    }

    // 获取操作
    const action = resource.getAction(actionId)
    if (!action) {
      return MCPResponse.error(request, `Action '${actionId}' not found for resource '${resourceId}'`, StatusCode.NOT_FOUND)
    }

    // 验证参数
    const validation = resource.validateActionParams(actionId, params)
    if (!validation.valid) {
      return MCPResponse.error(request, `Invalid parameters: ${validation.errors.join(', ')}`, StatusCode.BAD_REQUEST)
    }

    // 获取处理器
    const key = `${resourceId}:${actionId}`
    const handler = this.handlers.get(key)
    if (!handler) {
      return MCPResponse.error(request, `No handler registered for '${resourceId}:${actionId}'`, StatusCode.SERVER_ERROR)
    }

    try {
      // 执行处理器
      const result = await handler(params, userId)
      return MCPResponse.success(request, result)
    } catch (error) {
      console.error(`Error handling request '${resourceId}:${actionId}':`, error)
      return MCPResponse.error(request, error.message || 'Internal server error', StatusCode.SERVER_ERROR)
    }
  }
}

/**
 * MCP系统事件
 * 定义系统级事件类型
 */
const SystemEvents = {
  RESOURCE_REGISTERED: 'resource_registered',
  RESOURCE_UNREGISTERED: 'resource_unregistered',
  CLIENT_CONNECTED: 'client_connected',
  CLIENT_DISCONNECTED: 'client_disconnected',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure'
}

/**
 * MCP事件总线
 * 提供系统内部事件通知机制
 */
class MCPEventBus {
  constructor () {
    this.listeners = new Map()
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   * @returns {Function} - 移除监听器的函数
   */
  addEventListener (event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event).add(listener)

    return () => this.removeEventListener(event, listener)
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   * @returns {boolean} - 是否成功移除
   */
  removeEventListener (event, listener) {
    if (!this.listeners.has(event)) {
      return false
    }

    return this.listeners.get(event).delete(listener)
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  dispatchEvent (event, data) {
    if (!this.listeners.has(event)) {
      return
    }

    for (const listener of this.listeners.get(event)) {
      try {
        listener(data)
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error)
      }
    }
  }
}

module.exports = {
  MCP_VERSION,
  ResourceType,
  StatusCode,
  DataType,
  SystemEvents,
  MCPResource,
  MCPRequest,
  MCPResponse,
  MCPRegistry,
  MCPProcessor,
  MCPEventBus
}
