/**
 * 健康数据服务
 * 提供健康数据的存储、检索和分析功能
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')

/**
 * 健康数据类型
 */
const HealthDataType = {
  BODY_METRICS: 'body_metrics', // 体格指标（身高、体重等）
  VITAL_SIGNS: 'vital_signs', // 生命体征（血压、脉搏等）
  BLOOD_TEST: 'blood_test', // 血液检测
  TONGUE: 'tongue', // 舌象
  PULSE: 'pulse', // 脉象
  CONSTITUTION: 'constitution', // 体质评估
  DIET: 'diet', // 饮食记录
  SLEEP: 'sleep', // 睡眠记录
  ACTIVITY: 'activity', // 活动记录
  EMOTION: 'emotion', // 情绪记录
  SYMPTOM: 'symptom', // 症状记录
  MEDICATION: 'medication', // 用药记录
  TREATMENT: 'treatment' // 治疗记录
}

/**
 * 健康数据服务
 * 提供健康数据管理功能
 */
class HealthDataService {
  /**
   * 创建健康数据服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'health')
    this.userDataDir = path.join(this.dataDir, 'users')
    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  _initService () {
    // 确保数据目录存在
    fs.ensureDirSync(this.dataDir)
    fs.ensureDirSync(this.userDataDir)

    logger.info('健康数据服务初始化完成')
  }

  /**
   * 添加健康数据
   * @param {string} userId - 用户ID
   * @param {Object} data - 健康数据
   * @param {string} data.type - 数据类型
   * @param {Object} data.values - 数据值
   * @param {Date|string} [data.timestamp] - 数据时间戳
   * @param {Object} [data.metadata] - 元数据
   * @returns {Promise<Object>} 添加的健康数据
   */
  async addHealthData (userId, data) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    if (!data.type || !Object.values(HealthDataType).includes(data.type)) {
      throw new Error('无效的健康数据类型')
    }

    if (!data.values || typeof data.values !== 'object') {
      throw new Error('数据值不能为空且必须是对象')
    }

    // 确保用户目录和数据类型目录存在
    const userDir = path.join(this.userDataDir, userId)
    fs.ensureDirSync(userDir)

    const typeDir = path.join(userDir, data.type)
    fs.ensureDirSync(typeDir)

    // 创建健康数据记录
    const id = uuidv4()
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()

    const healthData = {
      id,
      type: data.type,
      values: data.values,
      timestamp: timestamp.toISOString(),
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 保存数据
    await this._saveHealthData(userId, healthData)

    return healthData
  }

  /**
   * 获取用户健康数据
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @param {string} [options.type] - 数据类型过滤
   * @param {Date|string} [options.startDate] - 开始日期
   * @param {Date|string} [options.endDate] - 结束日期
   * @param {number} [options.limit] - 结果数量限制
   * @param {string} [options.sort='desc'] - 排序方式(asc/desc)
   * @returns {Promise<Array>} 健康数据列表
   */
  async getUserHealthData (userId, options = {}) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    const userDir = path.join(this.userDataDir, userId)

    // 检查用户目录是否存在
    if (!fs.existsSync(userDir)) {
      return []
    }

    let dataItems = []

    // 根据类型过滤
    if (options.type) {
      const typeDir = path.join(userDir, options.type)

      if (fs.existsSync(typeDir)) {
        const items = await this._loadHealthDataByType(userId, options.type)
        dataItems = dataItems.concat(items)
      }
    } else {
      // 加载所有类型的数据
      for (const type of Object.values(HealthDataType)) {
        const typeDir = path.join(userDir, type)

        if (fs.existsSync(typeDir)) {
          const items = await this._loadHealthDataByType(userId, type)
          dataItems = dataItems.concat(items)
        }
      }
    }

    // 日期范围过滤
    if (options.startDate || options.endDate) {
      const startDate = options.startDate ? new Date(options.startDate).getTime() : 0
      const endDate = options.endDate ? new Date(options.endDate).getTime() : Date.now()

      dataItems = dataItems.filter(item => {
        const itemDate = new Date(item.timestamp).getTime()
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // 排序
    const sortDirection = options.sort === 'asc' ? 1 : -1
    dataItems.sort((a, b) => {
      return sortDirection * (new Date(a.timestamp) - new Date(b.timestamp))
    })

    // 限制结果数量
    if (options.limit && !isNaN(parseInt(options.limit))) {
      dataItems = dataItems.slice(0, parseInt(options.limit))
    }

    return dataItems
  }

  /**
   * 获取单个健康数据记录
   * @param {string} userId - 用户ID
   * @param {string} dataId - 数据ID
   * @returns {Promise<Object|null>} 健康数据记录
   */
  async getHealthDataById (userId, dataId) {
    if (!userId || !dataId) {
      throw new Error('用户ID和数据ID不能为空')
    }

    // 查找数据文件
    for (const type of Object.values(HealthDataType)) {
      const filePath = path.join(this.userDataDir, userId, type, `${dataId}.json`)

      if (fs.existsSync(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf8')
          return JSON.parse(content)
        } catch (error) {
          logger.error(`读取健康数据失败: ${dataId}`, error)
          return null
        }
      }
    }

    return null
  }

  /**
   * 更新健康数据
   * @param {string} userId - 用户ID
   * @param {string} dataId - 数据ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object|null>} 更新后的健康数据
   */
  async updateHealthData (userId, dataId, updates) {
    if (!userId || !dataId) {
      throw new Error('用户ID和数据ID不能为空')
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      throw new Error('更新内容不能为空')
    }

    // 获取原数据
    const healthData = await this.getHealthDataById(userId, dataId)

    if (!healthData) {
      return null
    }

    // 不允许更改的字段
    const immutableFields = ['id', 'type', 'created_at']

    // 更新数据
    const updatedData = {
      ...healthData,
      ...Object.fromEntries(
        Object.entries(updates).filter(([key]) => !immutableFields.includes(key))
      ),
      updated_at: new Date().toISOString()
    }

    // 如果更新了values，确保它是对象类型
    if (updates.values && typeof updates.values !== 'object') {
      throw new Error('数据值必须是对象')
    }

    // 保存更新后的数据
    await this._saveHealthData(userId, updatedData)

    return updatedData
  }

  /**
   * 删除健康数据
   * @param {string} userId - 用户ID
   * @param {string} dataId - 数据ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteHealthData (userId, dataId) {
    if (!userId || !dataId) {
      throw new Error('用户ID和数据ID不能为空')
    }

    // 查找并删除数据文件
    for (const type of Object.values(HealthDataType)) {
      const filePath = path.join(this.userDataDir, userId, type, `${dataId}.json`)

      if (fs.existsSync(filePath)) {
        try {
          await fs.unlink(filePath)
          return true
        } catch (error) {
          logger.error(`删除健康数据失败: ${dataId}`, error)
          throw error
        }
      }
    }

    return false
  }

  /**
   * 批量添加健康数据
   * @param {string} userId - 用户ID
   * @param {Array<Object>} dataItems - 健康数据项数组
   * @returns {Promise<Object>} 导入结果
   */
  async batchAddHealthData (userId, dataItems) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    if (!Array.isArray(dataItems) || dataItems.length === 0) {
      throw new Error('数据项不能为空')
    }

    const results = {
      total: dataItems.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const item of dataItems) {
      try {
        await this.addHealthData(userId, item)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          item: JSON.stringify(item).substr(0, 100),
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 获取用户健康数据统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getUserHealthStats (userId) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    const userDir = path.join(this.userDataDir, userId)

    if (!fs.existsSync(userDir)) {
      return {
        total: 0,
        types: {}
      }
    }

    const stats = {
      total: 0,
      types: {}
    }

    // 统计各类型数据数量
    for (const type of Object.values(HealthDataType)) {
      const typeDir = path.join(userDir, type)

      if (fs.existsSync(typeDir)) {
        try {
          const files = await fs.readdir(typeDir)
          const jsonFiles = files.filter(file => file.endsWith('.json'))
          stats.types[type] = jsonFiles.length
          stats.total += jsonFiles.length
        } catch (error) {
          logger.error(`统计健康数据失败: ${type}`, error)
          stats.types[type] = 0
        }
      } else {
        stats.types[type] = 0
      }
    }

    return stats
  }

  /**
   * 保存健康数据
   * @private
   * @param {string} userId - 用户ID
   * @param {Object} data - 健康数据
   * @returns {Promise<void>}
   */
  async _saveHealthData (userId, data) {
    const filePath = path.join(this.userDataDir, userId, data.type, `${data.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
  }

  /**
   * 加载指定类型的健康数据
   * @private
   * @param {string} userId - 用户ID
   * @param {string} type - 数据类型
   * @returns {Promise<Array>} 健康数据列表
   */
  async _loadHealthDataByType (userId, type) {
    const typeDir = path.join(this.userDataDir, userId, type)

    try {
      const files = await fs.readdir(typeDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const items = []

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(typeDir, file)
          const content = await fs.readFile(filePath, 'utf8')
          const item = JSON.parse(content)
          items.push(item)
        } catch (error) {
          logger.error(`加载健康数据文件失败: ${file}`, error)
        }
      }

      return items
    } catch (error) {
      logger.error(`加载健康数据类型失败: ${type}`, error)
      return []
    }
  }

  /**
   * 分析健康数据趋势
   * @param {string} userId - 用户ID
   * @param {string} type - 数据类型
   * @param {string} metric - 指标名称
   * @param {Object} options - 分析选项
   * @param {Date|string} [options.startDate] - 开始日期
   * @param {Date|string} [options.endDate] - 结束日期
   * @param {string} [options.interval='day'] - 时间间隔(day/week/month)
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeHealthTrend (userId, type, metric, options = {}) {
    // 获取数据
    const data = await this.getUserHealthData(userId, {
      type,
      startDate: options.startDate,
      endDate: options.endDate,
      sort: 'asc'
    })

    if (data.length === 0) {
      return {
        metric,
        type,
        points: []
      }
    }

    // 检查指标是否存在于数据中
    const hasMetric = data.some(item =>
      item.values && (metric in item.values)
    )

    if (!hasMetric) {
      throw new Error(`指标 "${metric}" 在数据中不存在`)
    }

    // 按时间间隔分组
    const interval = options.interval || 'day'
    const groupedData = this._groupDataByInterval(data, interval)

    // 计算每组的平均值
    const points = []

    for (const [timestamp, items] of Object.entries(groupedData)) {
      // 过滤有效数据项
      const validItems = items.filter(item =>
        item.values && typeof item.values[metric] === 'number'
      )

      if (validItems.length > 0) {
        // 计算平均值
        const sum = validItems.reduce((acc, item) => acc + item.values[metric], 0)
        const average = sum / validItems.length

        points.push({
          timestamp,
          value: average,
          count: validItems.length
        })
      }
    }

    return {
      metric,
      type,
      interval,
      points
    }
  }

  /**
   * 按时间间隔分组数据
   * @private
   * @param {Array<Object>} data - 数据列表
   * @param {string} interval - 时间间隔
   * @returns {Object} 分组结果
   */
  _groupDataByInterval (data, interval) {
    const grouped = {}

    for (const item of data) {
      const date = new Date(item.timestamp)
      let key

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'week':
          // 获取周的开始日期
          const startOfWeek = new Date(date)
          startOfWeek.setDate(date.getDate() - date.getDay()) // 周日为一周的开始
          key = startOfWeek.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!grouped[key]) {
        grouped[key] = []
      }

      grouped[key].push(item)
    }

    return grouped
  }
}

module.exports = {
  HealthDataType,
  HealthDataService
}
