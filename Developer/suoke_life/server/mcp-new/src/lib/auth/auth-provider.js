/**
 * 身份验证提供者实现
 * 提供用户认证和授权功能
 */

const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('../../services/loggerService')

/**
 * 权限角色枚举
 */
const Roles = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  SYSTEM: 'system'
}

/**
 * 基础认证提供者类
 */
class AuthProvider {
  constructor () {
    this.name = 'BasAuthProvider'
  }

  /**
   * 验证用户凭证
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 认证结果
   */
  async verifyCredentials (username, password) {
    throw new Error('必须由子类实现')
  }

  /**
   * 验证令牌
   * @param {string} token - JWT令牌
   * @returns {Promise<Object>} 验证结果
   */
  async authenticate (token) {
    throw new Error('必须由子类实现')
  }

  /**
   * 检查权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源名称
   * @param {string} action - 操作名称
   * @returns {Promise<boolean>} 是否有权限
   */
  async checkPermission (userId, resource, action) {
    throw new Error('必须由子类实现')
  }
}

/**
 * 文件存储认证提供者
 * 使用本地文件存储用户和权限信息
 */
class FileAuthProvider extends AuthProvider {
  /**
   * 创建基于文件的认证提供者
   * @param {Object} options - 配置选项
   * @param {string} options.usersFile - 用户数据文件路径
   * @param {string} options.jwtSecret - JWT密钥
   * @param {number} options.tokenExpiration - 令牌过期时间(秒)
   */
  constructor (options = {}) {
    super()
    this.name = 'FileAuthProvider'
    this.usersFile = options.usersFile || path.join(__dirname, '../../resources/auth/users.json')
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'suoke-mcp-secret'
    this.tokenExpiration = options.tokenExpiration || 60 * 60 * 24 * 7 // 7天

    // 确保用户数据目录存在
    const dirPath = path.dirname(this.usersFile)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // 初始化用户数据文件
    this._initUsersFile()
  }

  /**
   * 验证用户凭证
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 认证结果
   */
  async verifyCredentials (username, password) {
    try {
      const users = this._loadUsers()

      // 查找用户
      const user = users.find(u => u.username === username)
      if (!user) {
        return { success: false, message: '用户不存在' }
      }

      // 检查密码
      if (user.password !== this._hashPassword(password, user.salt)) {
        return { success: false, message: '密码错误' }
      }

      // 生成令牌
      const token = this._generateToken(user)

      return {
        success: true,
        userId: user.id,
        token,
        user: {
          id: user.id,
          username: user.username,
          roles: user.roles,
          name: user.name
        }
      }
    } catch (error) {
      logger.error(`验证用户凭证失败: ${error.message}`)
      return { success: false, message: '认证服务错误' }
    }
  }

  /**
   * 验证令牌
   * @param {string} token - JWT令牌
   * @returns {Promise<Object>} 验证结果
   */
  async authenticate (token) {
    try {
      // 验证令牌
      const decoded = jwt.verify(token, this.jwtSecret)

      // 从用户存储中获取用户
      const users = this._loadUsers()
      const user = users.find(u => u.id === decoded.userId)

      if (!user) {
        return { success: false, message: '用户不存在' }
      }

      return {
        success: true,
        userId: user.id,
        roles: user.roles,
        permissions: user.permissions || []
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, message: '令牌已过期' }
      }

      if (error.name === 'JsonWebTokenError') {
        return { success: false, message: '无效的令牌' }
      }

      logger.error(`验证令牌失败: ${error.message}`)
      return { success: false, message: '认证服务错误' }
    }
  }

  /**
   * 检查权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源名称
   * @param {string} action - 操作名称
   * @returns {Promise<boolean>} 是否有权限
   */
  async checkPermission (userId, resource, action) {
    try {
      const users = this._loadUsers()
      const user = users.find(u => u.id === userId)

      if (!user) {
        return false
      }

      // 管理员拥有所有权限
      if (user.roles.includes(Roles.ADMIN)) {
        return true
      }

      // 检查特定权限
      if (user.permissions) {
        // 检查精确匹配的权限
        const exactPermission = `${resource}:${action}`
        if (user.permissions.includes(exactPermission)) {
          return true
        }

        // 检查资源级别的通配符权限
        const resourceWildcard = `${resource}:*`
        if (user.permissions.includes(resourceWildcard)) {
          return true
        }

        // 检查全局通配符权限
        if (user.permissions.includes('*:*')) {
          return true
        }
      }

      return false
    } catch (error) {
      logger.error(`检查权限失败: ${error.message}`)
      return false
    }
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建结果
   */
  async createUser (userData) {
    try {
      const users = this._loadUsers()

      // 检查用户名是否存在
      if (users.some(u => u.username === userData.username)) {
        return { success: false, message: '用户名已存在' }
      }

      // 生成salt
      const salt = uuidv4()

      // 创建新用户
      const newUser = {
        id: uuidv4(),
        username: userData.username,
        password: this._hashPassword(userData.password, salt),
        salt,
        name: userData.name || userData.username,
        email: userData.email,
        roles: userData.roles || [Roles.USER],
        permissions: userData.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 添加到用户列表
      users.push(newUser)

      // 保存用户数据
      this._saveUsers(users)

      // 返回用户信息（不包含敏感数据）
      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          roles: newUser.roles,
          permissions: newUser.permissions,
          createdAt: newUser.createdAt
        }
      }
    } catch (error) {
      logger.error(`创建用户失败: ${error.message}`)
      return { success: false, message: '创建用户失败' }
    }
  }

  /**
   * 初始化用户数据文件
   * @private
   */
  _initUsersFile () {
    if (!fs.existsSync(this.usersFile)) {
      logger.info(`用户数据文件不存在，创建初始数据: ${this.usersFile}`)

      // 创建管理员账户
      const adminSalt = uuidv4()
      const adminPassword = 'admin123' // 初始密码

      const initialUsers = [
        {
          id: uuidv4(),
          username: 'admin',
          password: this._hashPassword(adminPassword, adminSalt),
          salt: adminSalt,
          name: '管理员',
          email: 'admin@suoke.life',
          roles: [Roles.ADMIN],
          permissions: ['*:*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      this._saveUsers(initialUsers)
      logger.info('创建了默认管理员账户，用户名: admin，密码: admin123')
    }
  }

  /**
   * 加载用户数据
   * @returns {Array} 用户列表
   * @private
   */
  _loadUsers () {
    try {
      if (!fs.existsSync(this.usersFile)) {
        return []
      }

      const usersData = fs.readFileSync(this.usersFile, 'utf8')
      return JSON.parse(usersData)
    } catch (error) {
      logger.error(`加载用户数据失败: ${error.message}`)
      return []
    }
  }

  /**
   * 保存用户数据
   * @param {Array} users - 用户列表
   * @private
   */
  _saveUsers (users) {
    try {
      const usersData = JSON.stringify(users, null, 2)
      fs.writeFileSync(this.usersFile, usersData, 'utf8')
    } catch (error) {
      logger.error(`保存用户数据失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 生成JWT令牌
   * @param {Object} user - 用户信息
   * @returns {string} JWT令牌
   * @private
   */
  _generateToken (user) {
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles
    }

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiration
    })
  }

  /**
   * 简单的密码哈希函数
   * @param {string} password - 密码
   * @param {string} salt - 盐
   * @returns {string} 哈希结果
   * @private
   */
  _hashPassword (password, salt) {
    // 注意：实际应用中应使用更安全的哈希算法，如bcrypt
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex')
  }
}

module.exports = {
  Roles,
  AuthProvider,
  FileAuthProvider
}
