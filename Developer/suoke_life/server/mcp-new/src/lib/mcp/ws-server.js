/**
 * MCP WebSocket服务实现
 * 提供基于WebSocket的实时通信能力
 */

const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const logger = require('../../services/loggerService')
const { MCPRequest, MCPResponse, StatusCode } = require('./protocol')

/**
 * MCP WebSocket服务器
 * 处理WebSocket连接和消息
 */
class MCPWebSocketServer {
  /**
   * 创建WebSocket服务器
   * @param {Object} options - 服务器选项
   * @param {number} options.port - 监听端口
   * @param {MCPProcessor} options.processor - MCP处理器
   * @param {Object} options.authProvider - 认证提供者(可选)
   */
  constructor (options) {
    this.port = options.port || 3031
    this.processor = options.processor
    this.authProvider = options.authProvider
    this.server = null
    this.clients = new Map() // 客户端连接映射
  }

  /**
   * 启动WebSocket服务器
   * @returns {Promise<void>}
   */
  start () {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocket.Server({ port: this.port })

        this.server.on('connection', (socket, request) => {
          this._handleConnection(socket, request)
        })

        this.server.on('error', (error) => {
          logger.error(`WebSocket服务器错误: ${error.message}`)
        })

        logger.info(`WebSocket服务器启动成功，端口: ${this.port}`)
        resolve()
      } catch (error) {
        logger.error(`WebSocket服务器启动失败: ${error.message}`)
        reject(error)
      }
    })
  }

  /**
   * 停止WebSocket服务器
   * @returns {Promise<void>}
   */
  stop () {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有客户端连接
        for (const client of this.clients.values()) {
          client.socket.close(1000, '服务器关闭')
        }

        this.server.close(() => {
          logger.info('WebSocket服务器已关闭')
          this.clients.clear()
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 广播消息给所有客户端
   * @param {Object} message - 要广播的消息
   * @param {Function} filter - 客户端过滤函数(可选)
   */
  broadcast (message, filter = null) {
    const data = JSON.stringify(message)

    for (const client of this.clients.values()) {
      if (!filter || filter(client)) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(data)
        }
      }
    }
  }

  /**
   * 发送消息给特定客户端
   * @param {string} clientId - 客户端ID
   * @param {Object} message - 要发送的消息
   * @returns {boolean} 是否发送成功
   */
  sendToClient (clientId, message) {
    const client = this.clients.get(clientId)
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      client.socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      logger.error(`向客户端 ${clientId} 发送消息失败: ${error.message}`)
      return false
    }
  }

  /**
   * 处理新的WebSocket连接
   * @param {WebSocket} socket - WebSocket连接
   * @param {http.IncomingMessage} request - HTTP请求
   * @private
   */
  _handleConnection (socket, request) {
    const clientId = uuidv4()
    const clientIp = request.socket.remoteAddress

    logger.info(`新的WebSocket连接: ${clientId} (${clientIp})`)

    // 保存客户端信息
    const client = {
      id: clientId,
      socket,
      ip: clientIp,
      authenticated: false,
      userId: null,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    }

    this.clients.set(clientId, client)

    // 设置消息处理程序
    socket.on('message', async (data) => {
      client.lastActivityAt = new Date().toISOString()
      await this._handleMessage(client, data)
    })

    // 设置关闭处理程序
    socket.on('close', (code, reason) => {
      logger.info(`WebSocket连接关闭: ${clientId}, 代码: ${code}, 原因: ${reason}`)
      this.clients.delete(clientId)
    })

    // 设置错误处理程序
    socket.on('error', (error) => {
      logger.error(`WebSocket连接错误: ${clientId}, ${error.message}`)
    })

    // 发送欢迎消息
    socket.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString(),
      message: '欢迎连接到索克生活MCP服务'
    }))
  }

  /**
   * 处理接收到的WebSocket消息
   * @param {Object} client - 客户端信息
   * @param {Buffer|String} data - 接收到的数据
   * @private
   */
  async _handleMessage (client, data) {
    let message

    try {
      // 解析消息
      message = JSON.parse(data.toString())
    } catch (error) {
      logger.error(`解析WebSocket消息失败: ${error.message}`)
      return this._sendErrorResponse(client, '无效的消息格式', 'invalid_format')
    }

    // 处理认证消息
    if (message.type === 'auth') {
      return this._handleAuthMessage(client, message)
    }

    // 处理MCP操作请求
    if (message.type === 'request') {
      return this._handleRequestMessage(client, message)
    }

    // 处理未知类型消息
    logger.warn(`收到未知类型的消息: ${message.type}`)
    this._sendErrorResponse(client, `未知的消息类型: ${message.type}`, 'unknown_type')
  }

  /**
   * 处理认证消息
   * @param {Object} client - 客户端信息
   * @param {Object} message - 认证消息
   * @private
   */
  async _handleAuthMessage (client, message) {
    if (!this.authProvider) {
      client.authenticated = true // 如果没有认证提供者，默认认证成功
      return this._sendAuthResponse(client, true)
    }

    try {
      const authResult = await this.authProvider.authenticate(message.token)

      if (authResult.success) {
        client.authenticated = true
        client.userId = authResult.userId

        logger.info(`客户端 ${client.id} 认证成功, 用户ID: ${client.userId}`)
        this._sendAuthResponse(client, true, client.userId)
      } else {
        logger.warn(`客户端 ${client.id} 认证失败: ${authResult.message}`)
        this._sendAuthResponse(client, false, null, authResult.message)
      }
    } catch (error) {
      logger.error(`处理认证消息失败: ${error.message}`)
      this._sendAuthResponse(client, false, null, '认证过程中发生错误')
    }
  }

  /**
   * 处理请求消息
   * @param {Object} client - 客户端信息
   * @param {Object} message - 请求消息
   * @private
   */
  async _handleRequestMessage (client, message) {
    // 检查认证状态（如果配置了认证提供者）
    if (this.authProvider && !client.authenticated) {
      return this._sendErrorResponse(client, '未认证', 'unauthorized', message.requestId)
    }

    // 验证请求格式
    if (!message.resourceId || !message.actionId) {
      return this._sendErrorResponse(
        client,
        '请求格式无效，缺少必需字段',
        'invalid_request',
        message.requestId
      )
    }

    try {
      // 创建MCP请求
      const request = new MCPRequest({
        requestId: message.requestId || uuidv4(),
        resourceId: message.resourceId,
        actionId: message.actionId,
        params: message.params || {}
      })

      // 处理请求
      logger.info(`处理WebSocket MCP请求: ${request.resourceId}/${request.actionId}`, {
        clientId: client.id,
        requestId: request.requestId
      })

      // 使用MCP处理器处理请求
      const response = await this.processor.processRequest(request)

      // 发送响应
      client.socket.send(JSON.stringify({
        type: 'response',
        ...response.toJSON()
      }))
    } catch (error) {
      logger.error(`处理WebSocket MCP请求失败: ${error.message}`)
      this._sendErrorResponse(
        client,
        '处理请求失败: ' + error.message,
        'internal_error',
        message.requestId
      )
    }
  }

  /**
   * 发送认证响应
   * @param {Object} client - 客户端信息
   * @param {boolean} success - 认证是否成功
   * @param {string|null} userId - 用户ID
   * @param {string|null} message - 错误消息
   * @private
   */
  _sendAuthResponse (client, success, userId = null, message = null) {
    const response = {
      type: 'auth_response',
      success,
      timestamp: new Date().toISOString()
    }

    if (success && userId) {
      response.userId = userId
    }

    if (!success && message) {
      response.error = { message }
    }

    client.socket.send(JSON.stringify(response))
  }

  /**
   * 发送错误响应
   * @param {Object} client - 客户端信息
   * @param {string} message - 错误消息
   * @param {string} code - 错误代码
   * @param {string|null} requestId - 请求ID
   * @private
   */
  _sendErrorResponse (client, message, code, requestId = null) {
    const response = {
      type: 'error',
      error: {
        message,
        code
      },
      timestamp: new Date().toISOString()
    }

    if (requestId) {
      response.requestId = requestId
    }

    client.socket.send(JSON.stringify(response))
  }
}

module.exports = MCPWebSocketServer
