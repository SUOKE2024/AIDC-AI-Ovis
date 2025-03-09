/**
 * 声诊模型调整器
 * 负责根据用户反馈和临床验证结果动态调整声诊分析参数和权重
 */
const path = require('path')
const fs = require('fs').promises
const { v4: uuidv4 } = require('uuid')

class VoiceModelAdjuster {
  /**
   * 构造函数
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.fiveToneModel - 五音分析模型
   * @param {Object} dependencies.voiceMLModel - 机器学习模型（可选）
   * @param {Object} dependencies.logger - 日志服务
   */
  constructor (dependencies) {
    this.dbClient = dependencies.dbClient
    this.fiveToneModel = dependencies.fiveToneModel
    this.voiceMLModel = dependencies.voiceMLModel
    this.logger = dependencies.logger || console

    // 模型版本与调整相关配置
    this.config = {
      // 参数调整阈值，超过此数值才会创建新版本
      adjustmentThreshold: 0.15,
      // 最大版本历史数量
      maxVersionHistory: 10,
      // 默认参数权重
      defaultWeights: {},
      // 调整窗口期（毫秒），避免频繁调整
      adjustmentCooldown: 24 * 60 * 60 * 1000 // 24小时
    }

    // 当前模型版本
    this.currentVersion = 'default'

    // 当前模型参数
    this.currentParameters = {}

    // 参数调整计数器
    this.adjustmentCounter = 0

    // 最后调整时间
    this.lastAdjustmentTime = 0

    // 参数历史记录
    this.parameterHistory = []
  }

  /**
   * 初始化调整器
   * @returns {Promise<void>}
   */
  async initialize () {
    try {
      // 加载默认参数配置
      await this.loadDefaultParameters()

      // 加载最新模型版本
      await this.loadLatestModelVersion()

      // 加载参数历史
      await this.loadParameterHistory()

      this.logger.info('声诊模型调整器初始化完成', {
        currentVersion: this.currentVersion
      })
    } catch (error) {
      this.logger.error('声诊模型调整器初始化失败', error)
      throw error
    }
  }

  /**
   * 加载默认参数配置
   * @returns {Promise<void>}
   */
  async loadDefaultParameters () {
    try {
      // 设置默认参数
      this.config.defaultWeights = {
        // 五音类型权重
        toneType: {
          gong: 0.2, // 宫音（脾）
          shang: 0.2, // 商音（肺）
          jue: 0.2, // 角音（肝）
          zhi: 0.2, // 徵音（心）
          yu: 0.2 // 羽音（肾）
        },

        // 声音特征权重
        timbre: {
          pitch: 0.25, // 音高特征
          intensity: 0.25, // 音强特征
          rhythm: 0.25, // 节奏特征
          quality: 0.25 // 音质特征
        },

        // 辨证参数权重
        disharmony: {
          primarySymptoms: 0.6, // 主症
          secondarySymptoms: 0.3, // 次症
          constitutionFactor: 0.1 // 体质因素
        },

        // 特征-病证相关度阈值
        featureThresholds: {
          high: 0.75,
          medium: 0.5,
          low: 0.25
        }
      }

      // 如果数据库中没有存储的默认参数，则保存当前默认参数
      const collection = this.dbClient.collection('voice_model_parameters')
      const defaultParams = await collection.findOne({ version: 'default' })

      if (!defaultParams) {
        await collection.insertOne({
          version: 'default',
          parameters: this.config.defaultWeights,
          createdAt: new Date(),
          isDefault: true
        })

        this.logger.info('已保存默认模型参数')
      } else {
        // 使用存储的默认参数
        this.config.defaultWeights = defaultParams.parameters
        this.logger.info('已加载存储的默认参数')
      }

      // 初始化当前参数为默认参数
      this.currentParameters = JSON.parse(JSON.stringify(this.config.defaultWeights))
    } catch (error) {
      this.logger.error('加载默认参数失败', error)
      throw error
    }
  }

  /**
   * 加载最新模型版本
   * @returns {Promise<void>}
   */
  async loadLatestModelVersion () {
    try {
      const collection = this.dbClient.collection('voice_model_parameters')

      // 查询最新版本，不包括默认版本
      const latestVersion = await collection.find({ isDefault: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      if (latestVersion.length > 0) {
        this.currentVersion = latestVersion[0].version
        this.currentParameters = latestVersion[0].parameters
        this.lastAdjustmentTime = new Date(latestVersion[0].createdAt).getTime()

        this.logger.info(`已加载最新模型版本: ${this.currentVersion}`)
      } else {
        this.currentVersion = 'default'
        this.currentParameters = JSON.parse(JSON.stringify(this.config.defaultWeights))
        this.logger.info('未找到历史版本，使用默认版本')
      }
    } catch (error) {
      this.logger.error('加载最新模型版本失败', error)
      throw error
    }
  }

  /**
   * 加载参数历史
   * @returns {Promise<void>}
   */
  async loadParameterHistory () {
    try {
      const collection = this.dbClient.collection('voice_model_parameters')

      // 获取历史版本列表（不包括默认版本）
      this.parameterHistory = await collection.find({ isDefault: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(this.config.maxVersionHistory)
        .toArray()

      this.logger.info(`已加载${this.parameterHistory.length}个历史版本`)
    } catch (error) {
      this.logger.error('加载参数历史失败', error)
      throw error
    }
  }

  /**
   * 应用参数调整
   * @param {Object} adjustments - 参数调整
   * @param {Object} [options={}] - 调整选项
   * @param {boolean} options.forceSave - 强制保存新版本
   * @param {boolean} options.isExpertAdjustment - 是否为专家调整
   * @param {string} options.description - 调整说明
   * @param {string} options.userId - 调整者ID
   * @returns {Promise<Object>} - 调整结果
   */
  async applyAdjustments (adjustments, options = {}) {
    try {
      const now = Date.now()

      // 检查冷却期
      if (!options.forceSave && now - this.lastAdjustmentTime < this.config.adjustmentCooldown) {
        this.logger.info('调整在冷却期内，累计变更不创建新版本')

        // 累积调整，但不保存新版本
        this._accumulateAdjustments(adjustments)

        return {
          success: true,
          version: this.currentVersion,
          message: '调整已累积，未创建新版本',
          isNewVersion: false
        }
      }

      // 计算调整程度
      const adjustmentDegree = this._calculateAdjustmentDegree(adjustments)

      // 应用调整
      this._applyParameterChanges(adjustments)

      // 检查是否需要保存新版本
      if (options.forceSave ||
          adjustmentDegree >= this.config.adjustmentThreshold ||
          options.isExpertAdjustment) {
        // 保存新版本
        const newVersion = await this._saveNewVersion(options)

        // 通知模型更新参数
        this._notifyModels()

        return {
          success: true,
          version: newVersion,
          message: '已创建新模型版本',
          adjustmentDegree,
          isNewVersion: true
        }
      } else {
        // 记录临时调整
        this.adjustmentCounter++

        this.logger.info('调整幅度不足以创建新版本', {
          adjustmentDegree,
          threshold: this.config.adjustmentThreshold,
          counter: this.adjustmentCounter
        })

        // 如果累积调整达到一定次数，也保存新版本
        if (this.adjustmentCounter >= 5) {
          const newVersion = await this._saveNewVersion(options)
          this.adjustmentCounter = 0

          // 通知模型更新参数
          this._notifyModels()

          return {
            success: true,
            version: newVersion,
            message: '累积调整达到阈值，已创建新版本',
            adjustmentDegree,
            isNewVersion: true
          }
        }

        return {
          success: true,
          version: this.currentVersion,
          message: '调整已应用，未创建新版本',
          adjustmentDegree,
          isNewVersion: false
        }
      }
    } catch (error) {
      this.logger.error('应用参数调整失败', error)
      throw error
    }
  }

  /**
   * 计算调整程度
   * @param {Object} adjustments - 参数调整
   * @returns {number} - 调整程度
   */
  _calculateAdjustmentDegree (adjustments) {
    // 避免空调整
    if (!adjustments || Object.keys(adjustments).length === 0) {
      return 0
    }

    let totalChanges = 0
    let totalParams = 0

    // 处理每种调整类型
    for (const adjustmentType in adjustments) {
      if (adjustments[adjustmentType] && typeof adjustments[adjustmentType] === 'object') {
        // 计算此类别的参数变化
        const typeChanges = this._calculateTypeChanges(
          this.currentParameters[adjustmentType] || {},
          adjustments[adjustmentType]
        )

        totalChanges += typeChanges.total
        totalParams += typeChanges.count
      }
    }

    // 计算平均变化程度
    return totalParams > 0 ? totalChanges / totalParams : 0
  }

  /**
   * 计算某类参数的变化程度
   * @param {Object} currentValues - 当前值
   * @param {Object} newValues - 新值
   * @returns {Object} - 变化统计
   */
  _calculateTypeChanges (currentValues, newValues) {
    let totalChange = 0
    let paramCount = 0

    // 检查每个参数的变化
    for (const param in newValues) {
      if (typeof newValues[param] === 'number' && typeof currentValues[param] === 'number') {
        // 计算变化百分比
        const change = Math.abs((newValues[param] - currentValues[param]) / (currentValues[param] || 1))
        totalChange += change
        paramCount++
      } else if (typeof newValues[param] === 'object' && typeof currentValues[param] === 'object') {
        // 递归计算嵌套对象
        const subChanges = this._calculateTypeChanges(currentValues[param], newValues[param])
        totalChange += subChanges.total
        paramCount += subChanges.count
      }
    }

    return {
      total: totalChange,
      count: paramCount
    }
  }

  /**
   * 累积参数调整
   * @param {Object} adjustments - 参数调整
   */
  _accumulateAdjustments (adjustments) {
    if (!adjustments) return

    // 应用调整到当前参数
    this._applyParameterChanges(adjustments)

    // 增加调整计数
    this.adjustmentCounter++
  }

  /**
   * 应用参数变更
   * @param {Object} adjustments - 参数调整
   */
  _applyParameterChanges (adjustments) {
    if (!adjustments) return

    // 遍历每种调整类型
    for (const adjustmentType in adjustments) {
      if (adjustments[adjustmentType] && typeof adjustments[adjustmentType] === 'object') {
        // 确保当前参数中有此类别
        if (!this.currentParameters[adjustmentType]) {
          this.currentParameters[adjustmentType] = {}
        }

        // 更新参数
        this._updateParameterGroup(
          this.currentParameters[adjustmentType],
          adjustments[adjustmentType]
        )
      }
    }
  }

  /**
   * 更新参数组
   * @param {Object} targetGroup - 目标参数组
   * @param {Object} sourceGroup - 源参数组
   */
  _updateParameterGroup (targetGroup, sourceGroup) {
    // 遍历源参数
    for (const key in sourceGroup) {
      // 如果是对象，递归更新
      if (typeof sourceGroup[key] === 'object' && sourceGroup[key] !== null) {
        if (!targetGroup[key] || typeof targetGroup[key] !== 'object') {
          targetGroup[key] = {}
        }
        this._updateParameterGroup(targetGroup[key], sourceGroup[key])
      } else {
        // 否则直接更新值
        targetGroup[key] = sourceGroup[key]
      }
    }
  }

  /**
   * 保存新版本
   * @param {Object} options - 保存选项
   * @returns {Promise<string>} - 新版本ID
   */
  async _saveNewVersion (options = {}) {
    try {
      const collection = this.dbClient.collection('voice_model_parameters')

      // 生成新版本ID
      const newVersion = `v${Date.now()}-${uuidv4().substring(0, 6)}`

      // 清理权重值确保在有效范围
      this._normalizeParameters()

      // 创建版本记录
      const versionRecord = {
        version: newVersion,
        parameters: JSON.parse(JSON.stringify(this.currentParameters)),
        createdAt: new Date(),
        isDefault: false,
        description: options.description || '模型参数自动调整',
        userId: options.userId || 'system',
        isExpertAdjustment: !!options.isExpertAdjustment,
        previousVersion: this.currentVersion
      }

      // 插入新版本
      await collection.insertOne(versionRecord)

      // 更新当前版本
      this.currentVersion = newVersion
      this.lastAdjustmentTime = Date.now()
      this.adjustmentCounter = 0

      // 更新历史记录
      await this.loadParameterHistory()

      this.logger.info(`已保存新模型版本: ${newVersion}`)

      return newVersion
    } catch (error) {
      this.logger.error('保存新版本失败', error)
      throw error
    }
  }

  /**
   * 规范化参数确保在有效范围
   */
  _normalizeParameters () {
    // 规范化五音类型权重
    if (this.currentParameters.toneType) {
      this._normalizeWeightGroup(this.currentParameters.toneType)
    }

    // 规范化声音特征权重
    if (this.currentParameters.timbre) {
      this._normalizeWeightGroup(this.currentParameters.timbre)
    }

    // 规范化辨证参数权重
    if (this.currentParameters.disharmony) {
      this._normalizeWeightGroup(this.currentParameters.disharmony)
    }

    // 规范化阈值参数
    if (this.currentParameters.featureThresholds) {
      const thresholds = this.currentParameters.featureThresholds

      // 确保阈值在0-1之间
      for (const key in thresholds) {
        thresholds[key] = Math.max(0, Math.min(1, thresholds[key]))
      }

      // 确保阈值顺序：高>中>低
      if (thresholds.high < thresholds.medium) {
        thresholds.high = thresholds.medium + 0.1
      }

      if (thresholds.medium < thresholds.low) {
        thresholds.medium = thresholds.low + 0.1
      }

      // 确保最高阈值不超过1
      if (thresholds.high > 1) {
        const diff = thresholds.high - 1
        thresholds.high = 1
        thresholds.medium = Math.max(0, thresholds.medium - diff)
        thresholds.low = Math.max(0, thresholds.low - diff)
      }
    }
  }

  /**
   * 规范化权重组，确保总和为1
   * @param {Object} weightGroup - 权重组
   */
  _normalizeWeightGroup (weightGroup) {
    const sum = Object.values(weightGroup).reduce((s, w) => s + w, 0)

    if (sum <= 0) {
      // 如果总和不正，使用均匀分布
      const count = Object.keys(weightGroup).length
      const uniformWeight = count > 0 ? 1 / count : 0

      for (const key in weightGroup) {
        weightGroup[key] = uniformWeight
      }
    } else {
      // 归一化权重
      for (const key in weightGroup) {
        weightGroup[key] = weightGroup[key] / sum
      }
    }
  }

  /**
   * 通知模型更新参数
   */
  _notifyModels () {
    // 通知五音模型
    if (this.fiveToneModel && typeof this.fiveToneModel.updateParameters === 'function') {
      this.fiveToneModel.updateParameters(this.currentParameters)
    }

    // 通知ML模型
    if (this.voiceMLModel && typeof this.voiceMLModel.updateParameters === 'function') {
      this.voiceMLModel.updateParameters(this.currentParameters)
    }
  }

  /**
   * 获取当前模型参数
   * @returns {Object} - 当前参数
   */
  getCurrentParameters () {
    return {
      version: this.currentVersion,
      parameters: JSON.parse(JSON.stringify(this.currentParameters)),
      lastUpdated: new Date(this.lastAdjustmentTime)
    }
  }

  /**
   * 获取参数历史
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} - 参数历史
   */
  async getParameterHistory (options = {}) {
    try {
      const { limit = 10, full = false } = options

      // 如果历史已加载且不需要完整参数，直接返回
      if (this.parameterHistory.length > 0 && !full) {
        const history = this.parameterHistory.slice(0, limit).map(version => ({
          version: version.version,
          createdAt: version.createdAt,
          description: version.description,
          userId: version.userId,
          isExpertAdjustment: version.isExpertAdjustment,
          previousVersion: version.previousVersion
        }))

        return history
      }

      // 查询历史记录
      const collection = this.dbClient.collection('voice_model_parameters')
      const query = { isDefault: { $ne: true } }

      const versions = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()

      // 处理结果
      if (!full) {
        return versions.map(version => ({
          version: version.version,
          createdAt: version.createdAt,
          description: version.description,
          userId: version.userId,
          isExpertAdjustment: version.isExpertAdjustment,
          previousVersion: version.previousVersion
        }))
      }

      return versions
    } catch (error) {
      this.logger.error('获取参数历史失败', error)
      throw error
    }
  }

  /**
   * 回滚到指定版本
   * @param {string} version - 目标版本
   * @param {Object} options - 回滚选项
   * @returns {Promise<Object>} - 回滚结果
   */
  async rollbackToVersion (version, options = {}) {
    try {
      if (version === this.currentVersion) {
        return {
          success: false,
          message: '已经是当前版本'
        }
      }

      // 查询目标版本
      const collection = this.dbClient.collection('voice_model_parameters')
      const targetVersion = await collection.findOne({ version })

      if (!targetVersion) {
        return {
          success: false,
          message: `未找到版本: ${version}`
        }
      }

      // 创建回滚记录
      const rollbackRecord = {
        version: `rollback-${Date.now()}-${uuidv4().substring(0, 6)}`,
        parameters: targetVersion.parameters,
        createdAt: new Date(),
        isDefault: false,
        description: options.description || `回滚到版本 ${version}`,
        userId: options.userId || 'system',
        isRollback: true,
        originalVersion: version,
        previousVersion: this.currentVersion
      }

      // 保存回滚版本
      await collection.insertOne(rollbackRecord)

      // 更新当前版本
      this.currentVersion = rollbackRecord.version
      this.currentParameters = JSON.parse(JSON.stringify(targetVersion.parameters))
      this.lastAdjustmentTime = Date.now()

      // 更新历史记录
      await this.loadParameterHistory()

      // 通知模型更新参数
      this._notifyModels()

      this.logger.info(`已回滚到版本 ${version}，新版本ID: ${rollbackRecord.version}`)

      return {
        success: true,
        version: rollbackRecord.version,
        message: `已回滚到版本 ${version}`
      }
    } catch (error) {
      this.logger.error(`回滚到版本${version}失败`, error)
      throw error
    }
  }

  /**
   * 重置为默认参数
   * @param {Object} options - 重置选项
   * @returns {Promise<Object>} - 重置结果
   */
  async resetToDefault (options = {}) {
    try {
      // 查询默认参数
      const collection = this.dbClient.collection('voice_model_parameters')
      const defaultParams = await collection.findOne({ isDefault: true })

      if (!defaultParams) {
        return {
          success: false,
          message: '未找到默认参数'
        }
      }

      // 创建重置记录
      const resetRecord = {
        version: `reset-${Date.now()}-${uuidv4().substring(0, 6)}`,
        parameters: defaultParams.parameters,
        createdAt: new Date(),
        isDefault: false,
        description: options.description || '重置为默认参数',
        userId: options.userId || 'system',
        isReset: true,
        previousVersion: this.currentVersion
      }

      // 保存重置版本
      await collection.insertOne(resetRecord)

      // 更新当前版本
      this.currentVersion = resetRecord.version
      this.currentParameters = JSON.parse(JSON.stringify(defaultParams.parameters))
      this.lastAdjustmentTime = Date.now()
      this.adjustmentCounter = 0

      // 更新历史记录
      await this.loadParameterHistory()

      // 通知模型更新参数
      this._notifyModels()

      this.logger.info(`已重置为默认参数，新版本ID: ${resetRecord.version}`)

      return {
        success: true,
        version: resetRecord.version,
        message: '已重置为默认参数'
      }
    } catch (error) {
      this.logger.error('重置为默认参数失败', error)
      throw error
    }
  }

  /**
   * 获取模型性能指标
   * @returns {Promise<Object>} - 性能指标
   */
  async getModelPerformanceMetrics () {
    try {
      // 查询反馈统计
      const feedbackCollection = this.dbClient.collection('voice_feedback')

      // 总体准确率
      const accuracyPipeline = [
        { $match: { isAccurate: { $exists: true } } },
        { $group: { _id: '$isAccurate', count: { $sum: 1 } } }
      ]

      const accuracyResults = await feedbackCollection.aggregate(accuracyPipeline).toArray()

      let accurateCount = 0
      let inaccurateCount = 0

      for (const result of accuracyResults) {
        if (result._id === true) {
          accurateCount = result.count
        } else if (result._id === false) {
          inaccurateCount = result.count
        }
      }

      const totalFeedbacks = accurateCount + inaccurateCount
      const accuracyRate = totalFeedbacks > 0 ? accurateCount / totalFeedbacks : 0

      // 当前版本准确率
      const currentVersionPipeline = [
        {
          $match: {
            isAccurate: { $exists: true },
            createdAt: { $gte: new Date(this.lastAdjustmentTime) }
          }
        },
        { $group: { _id: '$isAccurate', count: { $sum: 1 } } }
      ]

      const currentVersionResults = await feedbackCollection.aggregate(currentVersionPipeline).toArray()

      let currentAccurateCount = 0
      let currentInaccurateCount = 0

      for (const result of currentVersionResults) {
        if (result._id === true) {
          currentAccurateCount = result.count
        } else if (result._id === false) {
          currentInaccurateCount = result.count
        }
      }

      const currentTotalFeedbacks = currentAccurateCount + currentInaccurateCount
      const currentAccuracyRate = currentTotalFeedbacks > 0
        ? currentAccurateCount / currentTotalFeedbacks
        : 0

      // 满意度统计
      const satisfactionPipeline = [
        { $match: { satisfactionRating: { $exists: true, $ne: null } } },
        { $group: { _id: null, average: { $avg: '$satisfactionRating' } } }
      ]

      const satisfactionResults = await feedbackCollection.aggregate(satisfactionPipeline).toArray()
      const averageSatisfaction = satisfactionResults.length > 0
        ? satisfactionResults[0].average
        : 0

      // 当前版本满意度
      const currentSatisfactionPipeline = [
        {
          $match: {
            satisfactionRating: { $exists: true, $ne: null },
            createdAt: { $gte: new Date(this.lastAdjustmentTime) }
          }
        },
        { $group: { _id: null, average: { $avg: '$satisfactionRating' } } }
      ]

      const currentSatisfactionResults = await feedbackCollection.aggregate(currentSatisfactionPipeline).toArray()
      const currentAverageSatisfaction = currentSatisfactionResults.length > 0
        ? currentSatisfactionResults[0].average
        : 0

      return {
        currentVersion: this.currentVersion,
        totalFeedbacks,
        accuracyRate,
        averageSatisfaction,
        currentVersionStats: {
          feedbackCount: currentTotalFeedbacks,
          accuracyRate: currentAccuracyRate,
          averageSatisfaction: currentAverageSatisfaction
        },
        lastUpdated: new Date(this.lastAdjustmentTime)
      }
    } catch (error) {
      this.logger.error('获取模型性能指标失败', error)
      throw error
    }
  }

  /**
   * 监听临床验证结果更新模型
   * @param {Array} validationResults - 临床验证结果
   * @returns {Promise<Object>} - 处理结果
   */
  async onClinicalValidationUpdate (validationResults) {
    try {
      if (!validationResults || !Array.isArray(validationResults) || validationResults.length === 0) {
        return {
          success: false,
          message: '无效的验证结果'
        }
      }

      // 提取调整
      const adjustments = this._extractAdjustmentsFromValidation(validationResults)

      if (!adjustments || Object.keys(adjustments).length === 0) {
        return {
          success: false,
          message: '未提取到有效调整'
        }
      }

      // 应用专家调整
      const result = await this.applyAdjustments(adjustments, {
        isExpertAdjustment: true,
        description: '基于临床验证结果的调整',
        userId: 'clinical_validation'
      })

      return result
    } catch (error) {
      this.logger.error('处理临床验证结果失败', error)
      throw error
    }
  }

  /**
   * 从临床验证结果提取调整
   * @param {Array} validationResults - 临床验证结果
   * @returns {Object} - 提取的调整
   */
  _extractAdjustmentsFromValidation (validationResults) {
    // 汇总验证结果
    const toneAdjustments = {}
    const disharmonyAdjustments = {}

    // 处理每个验证结果
    for (const validation of validationResults) {
      // 处理五音调整
      if (validation.voiceDiagnosis?.results?.dominantTone &&
          validation.traditionalDiagnosis?.diagnosis) {
        const voiceTone = validation.voiceDiagnosis.results.dominantTone
        const clinicalDiagnosis = validation.traditionalDiagnosis.diagnosis

        // 强化准确的关联
        this._updateToneDisharmonyMapping(toneAdjustments, voiceTone, clinicalDiagnosis, validation.concordanceAnalysis?.matchScore || 0.5)
      }

      // 处理音色特征调整
      if (validation.voiceDiagnosis?.results?.timbreAnalysis?.features &&
          validation.traditionalDiagnosis?.diagnosis) {
        const features = validation.voiceDiagnosis.results.timbreAnalysis.features
        const clinicalDiagnosis = validation.traditionalDiagnosis.diagnosis

        // 更新特征与病证的关联
        this._updateFeatureDisharmonyMapping(disharmonyAdjustments, features, clinicalDiagnosis, validation.concordanceAnalysis?.matchScore || 0.5)
      }
    }

    return {
      toneDisharmonyMapping: toneAdjustments,
      featureDisharmonyMapping: disharmonyAdjustments
    }
  }

  /**
   * 更新五音与病证映射
   * @param {Object} adjustments - 调整对象
   * @param {string} tone - 五音
   * @param {string} diagnosis - 诊断结果
   * @param {number} confidence - 置信度
   */
  _updateToneDisharmonyMapping (adjustments, tone, diagnosis, confidence) {
    if (!adjustments[tone]) {
      adjustments[tone] = {}
    }

    if (!adjustments[tone][diagnosis]) {
      adjustments[tone][diagnosis] = 0
    }

    // 累加置信度
    adjustments[tone][diagnosis] += confidence
  }

  /**
   * 更新特征与病证映射
   * @param {Object} adjustments - 调整对象
   * @param {Array} features - 特征列表
   * @param {string} diagnosis - 诊断结果
   * @param {number} confidence - 置信度
   */
  _updateFeatureDisharmonyMapping (adjustments, features, diagnosis, confidence) {
    if (!adjustments[diagnosis]) {
      adjustments[diagnosis] = {}
    }

    // 处理每个特征
    for (const feature of features) {
      if (!adjustments[diagnosis][feature]) {
        adjustments[diagnosis][feature] = 0
      }

      // 累加置信度
      adjustments[diagnosis][feature] += confidence
    }
  }
}

module.exports = VoiceModelAdjuster
