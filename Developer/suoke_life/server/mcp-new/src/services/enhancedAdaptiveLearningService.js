/**
 * 增强型自适应学习服务
 * 通过分析用户行为、偏好和健康数据，不断优化系统的推荐和诊断能力
 */
class EnhancedAdaptiveLearningService {
  constructor (dependencies) {
    // 依赖注入
    this.db = dependencies.db
    this.logger = dependencies.logger
    this.tcmKnowledgeService = dependencies.tcmKnowledgeService
    this.userService = dependencies.userService
    this.diagnosisService = dependencies.diagnosisService
    this.voiceDiagnosisService = dependencies.voiceDiagnosisService

    // 集合名称定义
    this.userInteractionsCollection = 'user_interactions'
    this.learningModelsCollection = 'learning_models'
    this.insightPatternCollection = 'insight_patterns'
    this.feedbackLoopCollection = 'feedback_loops'
    this.adaptationRulesCollection = 'adaptation_rules'

    // 学习模式常量
    this.LEARNING_MODES = {
      ACTIVE: 'active', // 主动学习模式
      PASSIVE: 'passive', // 被动学习模式
      HYBRID: 'hybrid' // 混合学习模式
    }

    // 数据源类型
    this.DATA_SOURCES = {
      VOICE_DIAGNOSIS: 'voice_diagnosis',
      USER_FEEDBACK: 'user_feedback',
      HEALTH_DATA: 'health_data',
      EXPERT_VALIDATION: 'expert_validation',
      CONSULTATION: 'consultation'
    }
  }

  /**
   * 初始化服务
   */
  async initialize () {
    this.logger.info('初始化增强型自适应学习服务')

    try {
      await this.ensureCollections()
      await this.createIndexes()
      await this.initializeBaseModels()

      this.logger.info('增强型自适应学习服务初始化完成')
      return true
    } catch (error) {
      this.logger.error(`增强型自适应学习服务初始化失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 确保必要的集合存在
   */
  async ensureCollections () {
    const collections = await this.db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)

    const requiredCollections = [
      this.userInteractionsCollection,
      this.learningModelsCollection,
      this.insightPatternCollection,
      this.feedbackLoopCollection,
      this.adaptationRulesCollection
    ]

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        this.logger.info(`创建集合: ${collection}`)
        await this.db.createCollection(collection)
      }
    }
  }

  /**
   * 创建必要的索引
   */
  async createIndexes () {
    // 用户交互索引
    await this.db.collection(this.userInteractionsCollection).createIndex(
      { userId: 1, timestamp: -1 },
      { background: true }
    )

    await this.db.collection(this.userInteractionsCollection).createIndex(
      { interactionType: 1, dataSource: 1 },
      { background: true }
    )

    // 学习模型索引
    await this.db.collection(this.learningModelsCollection).createIndex(
      { modelType: 1, version: -1 },
      { background: true, unique: true }
    )

    // 洞察模式索引
    await this.db.collection(this.insightPatternCollection).createIndex(
      { patternType: 1, confidence: -1 },
      { background: true }
    )

    // 反馈循环索引
    await this.db.collection(this.feedbackLoopCollection).createIndex(
      { sourceId: 1, feedbackType: 1, timestamp: -1 },
      { background: true }
    )

    // 适应规则索引
    await this.db.collection(this.adaptationRulesCollection).createIndex(
      { triggerCondition: 1, priority: -1 },
      { background: true }
    )
  }

  /**
   * 初始化基础学习模型
   */
  async initializeBaseModels () {
    const modelsCount = await this.db.collection(this.learningModelsCollection).countDocuments()

    if (modelsCount === 0) {
      this.logger.info('初始化基础学习模型')

      const baseModels = [
        {
          modelType: 'user_preference',
          version: '1.0.0',
          description: '用户偏好学习模型',
          parameters: {
            learningRate: 0.05,
            decayFactor: 0.98,
            explorationRate: 0.2
          },
          features: ['interactionFrequency', 'sessionDuration', 'contentPreference', 'timeOfDay'],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelType: 'health_pattern',
          version: '1.0.0',
          description: '健康模式识别模型',
          parameters: {
            confidenceThreshold: 0.75,
            minDataPoints: 5,
            temporalWeight: 0.3
          },
          features: ['sleepQuality', 'dietPatterns', 'exerciseFrequency', 'stressLevels', 'voiceFeatures'],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelType: 'voice_feature_adaptation',
          version: '1.0.0',
          description: '声音特征自适应模型',
          parameters: {
            adaptationRate: 0.1,
            featureImportance: {
              frequency: 0.3,
              amplitude: 0.2,
              rhythm: 0.25,
              timbre: 0.25
            }
          },
          features: ['fundamentalFrequency', 'harmonicRatio', 'jitter', 'shimmer', 'formants'],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      await this.db.collection(this.learningModelsCollection).insertMany(baseModels)
    }
  }

  /**
   * 记录用户交互数据
   * @param {Object} interactionData - 用户交互数据
   */
  async recordUserInteraction (interactionData) {
    const interaction = {
      ...interactionData,
      timestamp: new Date(),
      processed: false
    }

    await this.db.collection(this.userInteractionsCollection).insertOne(interaction)

    // 如果是活跃学习模式，立即处理这个交互
    if (this.getCurrentLearningMode() === this.LEARNING_MODES.ACTIVE) {
      await this.processInteraction(interaction)
    }

    return interaction._id
  }

  /**
   * 获取当前学习模式
   * @returns {string} 学习模式
   */
  getCurrentLearningMode () {
    // 从配置或数据库获取当前学习模式
    // 这里简化为返回默认模式
    return this.LEARNING_MODES.HYBRID
  }

  /**
   * 处理单个交互数据
   * @param {Object} interaction - 交互数据对象
   */
  async processInteraction (interaction) {
    try {
      // 根据交互类型分发到不同的处理器
      switch (interaction.dataSource) {
        case this.DATA_SOURCES.VOICE_DIAGNOSIS:
          await this.processVoiceDiagnosisData(interaction)
          break
        case this.DATA_SOURCES.USER_FEEDBACK:
          await this.processUserFeedback(interaction)
          break
        case this.DATA_SOURCES.EXPERT_VALIDATION:
          await this.processExpertValidation(interaction)
          break
        default:
          await this.processGenericInteraction(interaction)
      }

      // 标记为已处理
      await this.db.collection(this.userInteractionsCollection).updateOne(
        { _id: interaction._id },
        { $set: { processed: true, processedAt: new Date() } }
      )
    } catch (error) {
      this.logger.error(`处理交互数据失败: ${error.message}`, { interactionId: interaction._id })
      throw error
    }
  }

  /**
   * 处理声音诊断数据
   * @param {Object} interaction - 声音诊断相关的交互数据
   */
  async processVoiceDiagnosisData (interaction) {
    const { voiceFeatures, diagnosisResults, userId } = interaction.data

    if (!voiceFeatures || !diagnosisResults) {
      return
    }

    try {
      // 获取用户历史声音诊断数据
      const userHistory = await this.db.collection(this.userInteractionsCollection).find({
        userId,
        dataSource: this.DATA_SOURCES.VOICE_DIAGNOSIS,
        processed: true
      }).sort({ timestamp: -1 }).limit(10).toArray()

      // 提取模式并生成洞察
      const patterns = this.extractVoicePatterns(voiceFeatures, userHistory)

      if (patterns.length > 0) {
        // 存储识别出的模式
        await this.storeInsightPatterns(patterns, userId, 'voice_diagnosis')

        // 应用适应规则
        await this.applyAdaptationRules(userId, patterns, 'voice_diagnosis')

        // 更新声音特征自适应模型
        await this.updateVoiceFeatureModel(voiceFeatures, diagnosisResults)
      }
    } catch (error) {
      this.logger.error(`处理声音诊断数据失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 从声音特征中提取模式
   * @param {Object} currentFeatures - 当前声音特征
   * @param {Array} historyData - 历史声音诊断数据
   * @returns {Array} 提取的模式数组
   */
  extractVoicePatterns (currentFeatures, historyData) {
    const patterns = []

    // 如果没有足够的历史数据，返回空数组
    if (historyData.length < 3) {
      return patterns
    }

    // 提取历史特征
    const historicalFeatures = historyData.map(h => h.data.voiceFeatures)

    // 识别声音特征变化趋势
    const frequencyTrend = this.calculateTrend(historicalFeatures.map(f => f.fundamentalFrequency))
    const amplitudeTrend = this.calculateTrend(historicalFeatures.map(f => f.amplitude))
    const rhythmTrend = this.calculateTrend(historicalFeatures.map(f => f.rhythm))

    // 添加有显著变化的模式
    if (Math.abs(frequencyTrend) > 0.1) {
      patterns.push({
        type: 'frequency_trend',
        value: frequencyTrend,
        confidence: this.calculateConfidence(frequencyTrend, historicalFeatures.length),
        description: frequencyTrend > 0 ? '声音频率呈上升趋势' : '声音频率呈下降趋势'
      })
    }

    if (Math.abs(amplitudeTrend) > 0.15) {
      patterns.push({
        type: 'amplitude_trend',
        value: amplitudeTrend,
        confidence: this.calculateConfidence(amplitudeTrend, historicalFeatures.length),
        description: amplitudeTrend > 0 ? '声音强度呈增强趋势' : '声音强度呈减弱趋势'
      })
    }

    // 识别五音特征变化
    const fiveToneChanges = this.detectFiveToneChanges(currentFeatures, historicalFeatures)
    if (fiveToneChanges.length > 0) {
      patterns.push(...fiveToneChanges)
    }

    return patterns
  }

  /**
   * 计算数据趋势
   * @param {Array} values - 数值数组
   * @returns {number} 趋势值
   */
  calculateTrend (values) {
    if (values.length < 2) return 0

    // 使用简单线性回归计算趋势
    const n = values.length
    const indices = Array.from({ length: n }, (_, i) => i)

    const sumX = indices.reduce((sum, x) => sum + x, 0)
    const sumY = values.reduce((sum, y) => sum + y, 0)
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0)

    // 计算斜率
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

    return slope
  }

  /**
   * 计算置信度
   * @param {number} value - 计算出的值
   * @param {number} sampleSize - 样本大小
   * @returns {number} 置信度 0-1
   */
  calculateConfidence (value, sampleSize) {
    // 简单置信度计算，考虑样本大小和值的绝对大小
    const basedOnSize = Math.min(0.5, sampleSize / 20) // 样本越大越有信心，最高0.5
    const basedOnValue = Math.min(0.5, Math.abs(value) * 2) // 值越显著越有信心，最高0.5

    return basedOnSize + basedOnValue
  }

  /**
   * 检测五音特征变化
   * @param {Object} currentFeatures - 当前声音特征
   * @param {Array} historicalFeatures - 历史声音特征
   * @returns {Array} 五音变化模式
   */
  detectFiveToneChanges (currentFeatures, historicalFeatures) {
    const patterns = []

    if (!currentFeatures.fiveTones || historicalFeatures.length === 0) {
      return patterns
    }

    // 计算历史数据中五音的平均值
    const avgHistorical = {
      gong: 0,
      shang: 0,
      jue: 0,
      zhi: 0,
      yu: 0
    }

    let validCount = 0

    for (const feature of historicalFeatures) {
      if (feature.fiveTones) {
        avgHistorical.gong += feature.fiveTones.gong || 0
        avgHistorical.shang += feature.fiveTones.shang || 0
        avgHistorical.jue += feature.fiveTones.jue || 0
        avgHistorical.zhi += feature.fiveTones.zhi || 0
        avgHistorical.yu += feature.fiveTones.yu || 0
        validCount++
      }
    }

    if (validCount > 0) {
      avgHistorical.gong /= validCount
      avgHistorical.shang /= validCount
      avgHistorical.jue /= validCount
      avgHistorical.zhi /= validCount
      avgHistorical.yu /= validCount

      // 比较当前与历史平均
      const current = currentFeatures.fiveTones
      const toneMap = {
        gong: { organ: '脾', threshold: 0.2 },
        shang: { organ: '肺', threshold: 0.2 },
        jue: { organ: '肝', threshold: 0.2 },
        zhi: { organ: '心', threshold: 0.2 },
        yu: { organ: '肾', threshold: 0.2 }
      }

      for (const [tone, { organ, threshold }] of Object.entries(toneMap)) {
        const diff = current[tone] - avgHistorical[tone]

        if (Math.abs(diff) > threshold) {
          patterns.push({
            type: 'five_tone_change',
            tone,
            organ,
            value: diff,
            confidence: this.calculateConfidence(diff, validCount),
            description: `${tone}音(${organ})特征变化显著，${diff > 0 ? '增强' : '减弱'}`
          })
        }
      }
    }

    return patterns
  }

  /**
   * 存储洞察模式
   * @param {Array} patterns - 模式数组
   * @param {string} userId - 用户ID
   * @param {string} source - 数据来源
   */
  async storeInsightPatterns (patterns, userId, source) {
    if (patterns.length === 0) return

    const insightsToStore = patterns.map(pattern => ({
      userId,
      source,
      patternType: pattern.type,
      patternValue: pattern.value,
      confidence: pattern.confidence,
      description: pattern.description,
      metadata: {
        ...pattern,
        type: undefined,
        value: undefined,
        confidence: undefined,
        description: undefined
      },
      createdAt: new Date(),
      appliedInRecommendation: false
    }))

    await this.db.collection(this.insightPatternCollection).insertMany(insightsToStore)
  }

  /**
   * 应用适应规则
   * @param {string} userId - 用户ID
   * @param {Array} patterns - 识别的模式
   * @param {string} sourceType - 数据来源类型
   */
  async applyAdaptationRules (userId, patterns, sourceType) {
    try {
      // 获取适用的适应规则
      const rules = await this.db.collection(this.adaptationRulesCollection).find({
        sourceType,
        status: 'active'
      }).sort({ priority: -1 }).toArray()

      if (rules.length === 0) return

      for (const pattern of patterns) {
        // 查找匹配的规则
        const matchedRules = rules.filter(rule => {
          // 检查规则条件是否匹配
          const conditionMatches = this.checkRuleCondition(rule.triggerCondition, pattern)
          return conditionMatches && pattern.confidence >= rule.minimumConfidence
        })

        for (const rule of matchedRules) {
          // 执行规则动作
          await this.executeRuleAction(rule, userId, pattern)

          // 记录规则应用
          await this.logRuleApplication(rule._id, userId, pattern)
        }
      }
    } catch (error) {
      this.logger.error(`应用适应规则失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 检查规则条件是否匹配
   * @param {Object} condition - 规则条件
   * @param {Object} pattern - 模式
   * @returns {boolean} 是否匹配
   */
  checkRuleCondition (condition, pattern) {
    if (condition.patternType && condition.patternType !== pattern.type) {
      return false
    }

    if (condition.valueRange) {
      const { min, max } = condition.valueRange
      if (
        (min !== undefined && pattern.value < min) ||
        (max !== undefined && pattern.value > max)
      ) {
        return false
      }
    }

    return true
  }

  /**
   * 执行规则动作
   * @param {Object} rule - 规则对象
   * @param {string} userId - 用户ID
   * @param {Object} pattern - 触发规则的模式
   */
  async executeRuleAction (rule, userId, pattern) {
    const { actionType, actionParams } = rule

    try {
      switch (actionType) {
        case 'adjust_model_parameters':
          await this.adjustModelParameters(actionParams.modelType, actionParams.adjustments)
          break
        case 'create_health_recommendation':
          await this.createHealthRecommendation(userId, pattern, actionParams)
          break
        case 'flag_for_expert_review':
          await this.flagForExpertReview(userId, pattern, actionParams)
          break
        default:
          this.logger.warn(`未知的规则动作类型: ${actionType}`)
      }
    } catch (error) {
      this.logger.error(`执行规则动作失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 调整模型参数
   * @param {string} modelType - 模型类型
   * @param {Object} adjustments - 参数调整
   */
  async adjustModelParameters (modelType, adjustments) {
    // 获取最新版本的模型
    const model = await this.db.collection(this.learningModelsCollection).findOne(
      { modelType, status: 'active' },
      { sort: { version: -1 } }
    )

    if (!model) {
      this.logger.warn(`找不到模型类型: ${modelType}`)
      return
    }

    // 应用参数调整
    const updatedParameters = { ...model.parameters }

    for (const [key, adjustment] of Object.entries(adjustments)) {
      if (updatedParameters[key] !== undefined) {
        // 如果是绝对值，直接赋值
        if (adjustment.type === 'absolute') {
          updatedParameters[key] = adjustment.value
        }
        // 如果是相对值，应用增量
        else if (adjustment.type === 'relative') {
          updatedParameters[key] += adjustment.value
        }

        // 确保参数在有效范围内
        if (adjustment.min !== undefined) {
          updatedParameters[key] = Math.max(adjustment.min, updatedParameters[key])
        }
        if (adjustment.max !== undefined) {
          updatedParameters[key] = Math.min(adjustment.max, updatedParameters[key])
        }
      }
    }

    // 更新模型参数
    await this.db.collection(this.learningModelsCollection).updateOne(
      { _id: model._id },
      {
        $set: {
          parameters: updatedParameters,
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * 创建健康建议
   * @param {string} userId - 用户ID
   * @param {Object} pattern - 触发建议的模式
   * @param {Object} params - 建议参数
   */
  async createHealthRecommendation (userId, pattern, params) {
    // 这里应该集成推荐服务，生成针对用户的健康建议
    this.logger.info(`为用户${userId}创建健康建议，基于${pattern.type}模式`)

    // 这里是一个简化的实现，实际应用中应该集成专门的推荐服务
    const recommendation = {
      userId,
      sourcePattern: pattern,
      title: params.title || `基于${pattern.description}的健康建议`,
      content: params.content || this.generateRecommendationContent(pattern),
      category: params.category || 'health',
      priority: params.priority || 'medium',
      createdAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + (params.expiryDays || 30) * 24 * 60 * 60 * 1000)
    }

    // 存储建议到相应的集合
    // 注意：这里假设有一个recommendations集合
    await this.db.collection('recommendations').insertOne(recommendation)

    // 标记模式已被用于推荐
    await this.db.collection(this.insightPatternCollection).updateMany(
      { userId, patternType: pattern.type },
      { $set: { appliedInRecommendation: true } }
    )
  }

  /**
   * 生成建议内容
   * @param {Object} pattern - 模式
   * @returns {string} 建议内容
   */
  generateRecommendationContent (pattern) {
    // 实际应用中，这里应该有更复杂的逻辑，可能会集成文本生成模型
    if (pattern.type === 'five_tone_change') {
      const direction = pattern.value > 0 ? '增强' : '减弱'

      const recommendations = {
        gong: {
          increase: '您的声音中宫音增强，表明脾胃功能可能有所改善。建议继续保持均衡饮食，规律作息。',
          decrease: '您的声音中宫音减弱，可能表明脾胃功能需要调理。建议避免过度疲劳，注意饮食规律，适当食用健脾食物。'
        },
        shang: {
          increase: '您的声音中商音增强，表明肺部功能可能有所改善。建议继续保持良好的呼吸习惯和规律运动。',
          decrease: '您的声音中商音减弱，可能表明肺部功能需要关注。建议增加户外活动，练习深呼吸，保持环境通风。'
        },
        jue: {
          increase: '您的声音中角音增强，表明肝部功能可能有所改善。建议继续保持情绪稳定，规律作息。',
          decrease: '您的声音中角音减弱，可能表明肝部功能需要调理。建议注意情绪管理，避免过度紧张和焦虑，保证充足睡眠。'
        },
        zhi: {
          increase: '您的声音中徵音增强，表明心脏功能可能有所改善。建议继续保持积极心态和适度运动。',
          decrease: '您的声音中徵音减弱，可能表明心脏功能需要关注。建议保持心情舒畅，避免过度劳累，适当进行有氧运动。'
        },
        yu: {
          increase: '您的声音中羽音增强，表明肾部功能可能有所改善。建议继续保持良好的休息和适度运动。',
          decrease: '您的声音中羽音减弱，可能表明肾部功能需要调理。建议避免过度劳累，保证充足睡眠，适当进行强健腰部的锻炼。'
        }
      }

      const key = direction === '增强' ? 'increase' : 'decrease'
      return recommendations[pattern.tone]?.[key] ||
        `您的声音中${pattern.tone}音(对应${pattern.organ})有${direction}趋势，建议关注相关器官健康状况。`
    }

    return '基于您的声音特征变化，我们为您提供了个性化健康建议。'
  }

  /**
   * 标记需要专家审核
   * @param {string} userId - 用户ID
   * @param {Object} pattern - 模式
   * @param {Object} params - 参数
   */
  async flagForExpertReview (userId, pattern, params) {
    const reviewItem = {
      userId,
      sourcePattern: pattern,
      reviewType: params.reviewType || 'pattern_validation',
      priority: params.priority || 'medium',
      status: 'pending',
      notes: params.notes || `需要专家验证${pattern.description}的有效性`,
      createdAt: new Date()
    }

    // 存储到专家审核队列
    // 注意：这里假设有一个expert_reviews集合
    await this.db.collection('expert_reviews').insertOne(reviewItem)
  }

  /**
   * 记录规则应用
   * @param {string} ruleId - 规则ID
   * @param {string} userId - 用户ID
   * @param {Object} pattern - 模式
   */
  async logRuleApplication (ruleId, userId, pattern) {
    const logEntry = {
      ruleId,
      userId,
      patternType: pattern.type,
      patternValue: pattern.value,
      appliedAt: new Date(),
      successful: true
    }

    await this.db.collection('rule_application_logs').insertOne(logEntry)
  }

  /**
   * 更新声音特征模型
   * @param {Object} voiceFeatures - 声音特征
   * @param {Object} diagnosisResults - 诊断结果
   */
  async updateVoiceFeatureModel (voiceFeatures, diagnosisResults) {
    try {
      // 获取声音特征自适应模型
      const model = await this.db.collection(this.learningModelsCollection).findOne(
        { modelType: 'voice_feature_adaptation', status: 'active' },
        { sort: { version: -1 } }
      )

      if (!model) {
        this.logger.warn('找不到声音特征自适应模型')
        return
      }

      // 获取模型的当前参数
      const { adaptationRate, featureImportance } = model.parameters

      // 更新模型参数 - 这里是一个简化的自适应学习逻辑
      // 实际应用中可能需要更复杂的算法

      // 1. 检查诊断结果是否准确（可能需要用户反馈或专家验证）
      const isAccurate = diagnosisResults.confidence > 0.7 // 假设有置信度字段

      if (!isAccurate) {
        // 如果诊断不准确，调整适应率
        const newAdaptationRate = Math.max(0.05, adaptationRate * 0.9)

        // 更新模型参数
        await this.db.collection(this.learningModelsCollection).updateOne(
          { _id: model._id },
          {
            $set: {
              'parameters.adaptationRate': newAdaptationRate,
              updatedAt: new Date()
            }
          }
        )
      } else {
        // 2. 识别哪些特征对诊断最有帮助
        const newImportance = { ...featureImportance }

        // 根据诊断结果中的关键特征调整重要性
        if (diagnosisResults.keyFeatures) {
          for (const feature of diagnosisResults.keyFeatures) {
            if (newImportance[feature]) {
              // 提高有用特征的重要性，但最高不超过0.4
              newImportance[feature] = Math.min(0.4, newImportance[feature] * 1.05)
            }
          }

          // 归一化特征重要性，确保总和为1
          const sum = Object.values(newImportance).reduce((a, b) => a + b, 0)
          for (const feature in newImportance) {
            newImportance[feature] /= sum
          }

          // 更新模型参数
          await this.db.collection(this.learningModelsCollection).updateOne(
            { _id: model._id },
            {
              $set: {
                'parameters.featureImportance': newImportance,
                updatedAt: new Date()
              }
            }
          )
        }
      }
    } catch (error) {
      this.logger.error(`更新声音特征模型失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 处理用户反馈
   * @param {Object} interaction - 用户反馈交互数据
   */
  async processUserFeedback (interaction) {
    const { feedbackType, targetId, rating, comments, userId } = interaction.data

    try {
      // 存储反馈
      const feedback = {
        userId,
        feedbackType,
        targetId, // 反馈目标的ID，如诊断ID、建议ID等
        rating, // 用户评分
        comments, // 用户评论
        timestamp: new Date()
      }

      await this.db.collection(this.feedbackLoopCollection).insertOne(feedback)

      // 根据反馈类型处理
      switch (feedbackType) {
        case 'diagnosis_feedback':
          await this.processDiagnosisFeedback(feedback)
          break
        case 'recommendation_feedback':
          await this.processRecommendationFeedback(feedback)
          break
        case 'voice_analysis_feedback':
          await this.processVoiceAnalysisFeedback(feedback)
          break
      }
    } catch (error) {
      this.logger.error(`处理用户反馈失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 处理诊断反馈
   * @param {Object} feedback - 反馈数据
   */
  async processDiagnosisFeedback (feedback) {
    // 根据用户反馈调整诊断算法
    if (feedback.rating < 3) { // 假设评分范围是1-5
      // 对于低评分，考虑调整诊断参数或标记为需要专家审核
      await this.flagForExpertReview(feedback.userId, {
        type: 'diagnosis_feedback',
        value: feedback.rating,
        description: `用户对诊断结果评分较低: ${feedback.rating}/5`
      }, {
        reviewType: 'diagnosis_accuracy',
        priority: 'high',
        notes: feedback.comments
      })
    } else if (feedback.rating >= 4) {
      // 高评分，可以用来增强模型的置信度
      await this.reinforceDiagnosisModel(feedback)
    }
  }

  /**
   * 增强诊断模型
   * @param {Object} feedback - 反馈数据
   */
  async reinforceDiagnosisModel (feedback) {
    // 在实际应用中，这里应该有更复杂的逻辑来利用正面反馈增强模型
    this.logger.info(`用户${feedback.userId}对诊断${feedback.targetId}给予了正面反馈`)

    // 将这个诊断标记为高质量示例，可用于未来的模型训练
    await this.db.collection('diagnosis_results').updateOne(
      { _id: feedback.targetId },
      { $set: { qualityRating: feedback.rating, userFeedback: feedback.comments } }
    )
  }

  /**
   * 处理推荐反馈
   * @param {Object} feedback - 反馈数据
   */
  async processRecommendationFeedback (feedback) {
    // 获取原始推荐
    const recommendation = await this.db.collection('recommendations').findOne(
      { _id: feedback.targetId }
    )

    if (!recommendation) {
      this.logger.warn(`找不到ID为${feedback.targetId}的推荐`)
      return
    }

    // 更新推荐状态
    await this.db.collection('recommendations').updateOne(
      { _id: feedback.targetId },
      { $set: { userRating: feedback.rating, userFeedback: feedback.comments } }
    )

    // 根据反馈调整推荐策略
    if (feedback.rating < 3) {
      // 低评分，可以用来调整推荐策略
      this.logger.info(`用户${feedback.userId}对推荐${feedback.targetId}给予了低评分`)
    }
  }

  /**
   * 处理语音分析反馈
   * @param {Object} feedback - 反馈数据
   */
  async processVoiceAnalysisFeedback (feedback) {
    // 获取原始语音分析
    const voiceAnalysis = await this.db.collection('voice_analyses').findOne(
      { _id: feedback.targetId }
    )

    if (!voiceAnalysis) {
      this.logger.warn(`找不到ID为${feedback.targetId}的语音分析`)
      return
    }

    // 更新语音分析状态
    await this.db.collection('voice_analyses').updateOne(
      { _id: feedback.targetId },
      { $set: { userRating: feedback.rating, userFeedback: feedback.comments } }
    )

    // 根据用户反馈调整五音分析算法
    if (feedback.rating < 3) {
      // 对于低评分，调整五音分析的敏感度
      await this.adjustVoiceAnalysisParameters(feedback)
    } else if (feedback.rating >= 4) {
      // 高评分，增强模型
      await this.reinforceVoiceAnalysisModel(feedback, voiceAnalysis)
    }
  }

  /**
   * 调整语音分析参数
   * @param {Object} feedback - 反馈数据
   */
  async adjustVoiceAnalysisParameters (feedback) {
    // 根据用户反馈调整参数
    const adjustments = {
      frequencySensitivity: {
        type: 'relative',
        value: -0.05, // 降低敏感度
        min: 0.3,
        max: 0.9
      },
      amplitudeSensitivity: {
        type: 'relative',
        value: -0.05,
        min: 0.3,
        max: 0.9
      }
    }

    await this.adjustModelParameters('voice_feature_adaptation', adjustments)

    // 记录调整
    this.logger.info(`根据用户反馈调整了语音分析参数，反馈ID: ${feedback._id}`)
  }

  /**
   * 增强语音分析模型
   * @param {Object} feedback - 反馈数据
   * @param {Object} voiceAnalysis - 原始语音分析数据
   */
  async reinforceVoiceAnalysisModel (feedback, voiceAnalysis) {
    // 用高质量样本增强模型
    const model = await this.db.collection(this.learningModelsCollection).findOne(
      { modelType: 'voice_feature_adaptation', status: 'active' },
      { sort: { version: -1 } }
    )

    if (!model) return

    // 将这个分析标记为高质量示例，可用于未来模型训练
    await this.db.collection('voice_analyses').updateOne(
      { _id: feedback.targetId },
      {
        $set: {
          qualityRating: feedback.rating,
          isTrainingExample: true,
          trainingExampleAddedAt: new Date()
        }
      }
    )

    // 可以根据这个高质量样本微调当前模型
    // 这里是简化实现，真实系统中可能需要更复杂的机器学习算法
    const featureWeights = model.parameters.featureImportance
    const keyFeatures = voiceAnalysis.keyFeatures || []

    // 提高关键特征的权重
    let updated = false
    for (const feature of keyFeatures) {
      if (featureWeights[feature]) {
        featureWeights[feature] = Math.min(0.4, featureWeights[feature] * 1.02)
        updated = true
      }
    }

    if (updated) {
      // 归一化
      const sum = Object.values(featureWeights).reduce((a, b) => a + b, 0)
      for (const key in featureWeights) {
        featureWeights[key] /= sum
      }

      // 更新模型
      await this.db.collection(this.learningModelsCollection).updateOne(
        { _id: model._id },
        {
          $set: {
            'parameters.featureImportance': featureWeights,
            updatedAt: new Date()
          }
        }
      )
    }
  }

  /**
   * 处理专家验证
   * @param {Object} interaction - 专家验证交互数据
   */
  async processExpertValidation (interaction) {
    const { expertId, targetId, validationType, validationResult, notes } = interaction.data

    try {
      // 记录专家验证
      const validation = {
        expertId,
        targetId,
        validationType,
        validationResult,
        notes,
        timestamp: new Date()
      }

      await this.db.collection('expert_validations').insertOne(validation)

      // 根据验证类型处理
      switch (validationType) {
        case 'diagnosis_validation':
          await this.processDiagnosisValidation(validation)
          break
        case 'voice_analysis_validation':
          await this.processVoiceAnalysisValidation(validation)
          break
        case 'pattern_validation':
          await this.processPatternValidation(validation)
          break
      }
    } catch (error) {
      this.logger.error(`处理专家验证失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 处理诊断验证
   * @param {Object} validation - 验证数据
   */
  async processDiagnosisValidation (validation) {
    // 获取被验证的诊断
    const diagnosis = await this.db.collection('diagnosis_results').findOne(
      { _id: validation.targetId }
    )

    if (!diagnosis) {
      this.logger.warn(`找不到ID为${validation.targetId}的诊断`)
      return
    }

    // 更新诊断状态
    await this.db.collection('diagnosis_results').updateOne(
      { _id: validation.targetId },
      {
        $set: {
          expertValidation: validation.validationResult,
          expertNotes: validation.notes,
          validatedAt: validation.timestamp,
          validatedBy: validation.expertId
        }
      }
    )

    // 如果诊断被专家确认为准确，可以用来增强模型
    if (validation.validationResult === 'accurate') {
      await this.db.collection('diagnosis_results').updateOne(
        { _id: validation.targetId },
        {
          $set: {
            isTrainingExample: true,
            trainingExampleAddedAt: new Date()
          }
        }
      )
    }
    // 如果诊断被专家确认为不准确，可以用来调整模型
    else if (validation.validationResult === 'inaccurate') {
      // 调整相关模型参数
      // 这里是简化实现，实际应用中可能需要更复杂的逻辑
      const diagnosisType = diagnosis.type

      if (diagnosisType === 'voice_diagnosis') {
        await this.adjustModelParameters('voice_feature_adaptation', {
          confidenceThreshold: {
            type: 'relative',
            value: 0.05, // 提高置信度阈值，减少误判
            min: 0.5,
            max: 0.9
          }
        })
      }
    }
  }

  /**
   * 处理语音分析验证
   * @param {Object} validation - 验证数据
   */
  async processVoiceAnalysisValidation (validation) {
    // 获取被验证的语音分析
    const voiceAnalysis = await this.db.collection('voice_analyses').findOne(
      { _id: validation.targetId }
    )

    if (!voiceAnalysis) {
      this.logger.warn(`找不到ID为${validation.targetId}的语音分析`)
      return
    }

    // 更新语音分析状态
    await this.db.collection('voice_analyses').updateOne(
      { _id: validation.targetId },
      {
        $set: {
          expertValidation: validation.validationResult,
          expertNotes: validation.notes,
          validatedAt: validation.timestamp,
          validatedBy: validation.expertId
        }
      }
    )

    // 如果语音分析被专家确认为准确，可以用来增强模型
    if (validation.validationResult === 'accurate') {
      await this.reinforceVoiceAnalysisModelByExpert(voiceAnalysis)
    }
    // 如果语音分析被专家确认为不准确，可以用来调整模型
    else if (validation.validationResult === 'inaccurate') {
      await this.adjustVoiceAnalysisModelByExpert(voiceAnalysis, validation)
    }
  }

  /**
   * 由专家验证增强语音分析模型
   * @param {Object} voiceAnalysis - 语音分析数据
   */
  async reinforceVoiceAnalysisModelByExpert (voiceAnalysis) {
    // 将这个分析标记为专家验证的高质量示例
    await this.db.collection('voice_analyses').updateOne(
      { _id: voiceAnalysis._id },
      {
        $set: {
          isTrainingExample: true,
          expertVerified: true,
          trainingExampleAddedAt: new Date()
        }
      }
    )

    // 更新模型，提高对这类样本的置信度
    const model = await this.db.collection(this.learningModelsCollection).findOne(
      { modelType: 'voice_feature_adaptation', status: 'active' },
      { sort: { version: -1 } }
    )

    if (!model) return

    // 调整模型参数，专家验证的样本权重更高
    await this.db.collection(this.learningModelsCollection).updateOne(
      { _id: model._id },
      {
        $set: {
          'parameters.expertVerifiedWeight': Math.min(0.8, (model.parameters.expertVerifiedWeight || 0.6) + 0.05),
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * 由专家验证调整语音分析模型
   * @param {Object} voiceAnalysis - 语音分析数据
   * @param {Object} validation - 验证数据
   */
  async adjustVoiceAnalysisModelByExpert (voiceAnalysis, validation) {
    // 根据专家反馈调整参数
    const model = await this.db.collection(this.learningModelsCollection).findOne(
      { modelType: 'voice_feature_adaptation', status: 'active' },
      { sort: { version: -1 } }
    )

    if (!model) return

    // 专家提供了具体的调整建议
    if (validation.notes && validation.notes.includes('调整敏感度')) {
      await this.adjustModelParameters('voice_feature_adaptation', {
        frequencySensitivity: {
          type: 'relative',
          value: -0.1,
          min: 0.3,
          max: 0.9
        }
      })
    }

    // 专家提供了具体的五音调整建议
    if (validation.notes && validation.notes.includes('五音阈值')) {
      // 解析专家建议中的具体阈值调整值
      const match = validation.notes.match(/五音阈值调整:([\d\.]+)/)
      if (match && match[1]) {
        const adjustment = parseFloat(match[1])

        await this.adjustModelParameters('voice_feature_adaptation', {
          fiveToneThreshold: {
            type: 'absolute',
            value: adjustment,
            min: 0.2,
            max: 0.8
          }
        })
      }
    }
  }

  /**
   * 处理模式验证
   * @param {Object} validation - 验证数据
   */
  async processPatternValidation (validation) {
    // 获取被验证的模式
    const pattern = await this.db.collection(this.insightPatternCollection).findOne(
      { _id: validation.targetId }
    )

    if (!pattern) {
      this.logger.warn(`找不到ID为${validation.targetId}的模式`)
      return
    }

    // 更新模式状态
    await this.db.collection(this.insightPatternCollection).updateOne(
      { _id: validation.targetId },
      {
        $set: {
          expertValidation: validation.validationResult,
          expertNotes: validation.notes,
          validatedAt: validation.timestamp,
          validatedBy: validation.expertId
        }
      }
    )

    // 根据专家验证结果调整模式识别的置信度阈值
    if (validation.validationResult === 'invalid') {
      // 如果专家认为模式无效，提高置信度阈值
      const modelType = pattern.patternType.includes('voice')
        ? 'voice_feature_adaptation'
        : 'health_pattern'

      await this.adjustModelParameters(modelType, {
        confidenceThreshold: {
          type: 'relative',
          value: 0.05,
          min: 0.5,
          max: 0.9
        }
      })
    }
  }

  /**
   * 处理通用交互
   * @param {Object} interaction - 交互数据
   */
  async processGenericInteraction (interaction) {
    // 记录用户会话数据，用于学习用户行为模式
    try {
      const { userId, sessionId, interactionType, metadata } = interaction

      if (!userId || !interactionType) {
        return
      }

      // 根据交互类型分析用户行为模式
      switch (interactionType) {
        case 'page_view':
          await this.analyzePageViewPattern(userId, metadata)
          break
        case 'feature_usage':
          await this.analyzeFeatureUsagePattern(userId, metadata)
          break
        case 'search_query':
          await this.analyzeSearchPattern(userId, metadata)
          break
        case 'session_duration':
          await this.analyzeSessionDurationPattern(userId, metadata)
          break
      }
    } catch (error) {
      this.logger.error(`处理通用交互失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 分析页面浏览模式
   * @param {string} userId - 用户ID
   * @param {Object} metadata - 元数据
   */
  async analyzePageViewPattern (userId, metadata) {
    // 获取用户最近的页面浏览历史
    const recentPageViews = await this.db.collection(this.userInteractionsCollection).find({
      userId,
      interactionType: 'page_view',
      processed: true
    }).sort({ timestamp: -1 }).limit(20).toArray()

    // 计算页面浏览频率
    const pageFrequency = {}
    for (const view of recentPageViews) {
      const page = view.metadata.page
      pageFrequency[page] = (pageFrequency[page] || 0) + 1
    }

    // 找出最常访问的页面
    const favoritePage = Object.entries(pageFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([page]) => page)

    // 更新用户偏好
    if (favoritePage.length > 0) {
      await this.db.collection('user_preferences').updateOne(
        { userId },
        {
          $set: {
            favoritePages: favoritePage,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
    }
  }

  /**
   * 分析功能使用模式
   * @param {string} userId - 用户ID
   * @param {Object} metadata - 元数据
   */
  async analyzeFeatureUsagePattern (userId, metadata) {
    // 类似于页面浏览模式分析
    // 这里专注于用户使用的功能
    const { featureName, usageDuration, usageResult } = metadata

    // 更新功能使用统计
    await this.db.collection('feature_usage_stats').updateOne(
      { userId, featureName },
      {
        $inc: {
          useCount: 1,
          totalDuration: usageDuration || 0
        },
        $set: {
          lastUsed: new Date()
        }
      },
      { upsert: true }
    )

    // 如果用户对功能使用有明显偏好，可以更新用户模型
    const userStats = await this.db.collection('feature_usage_stats').find({
      userId
    }).sort({ useCount: -1 }).toArray()

    if (userStats.length > 0) {
      const topFeatures = userStats.slice(0, 3).map(stat => stat.featureName)

      await this.db.collection('user_preferences').updateOne(
        { userId },
        {
          $set: {
            favoriteFeatures: topFeatures,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
    }
  }

  /**
   * 分析搜索模式
   * @param {string} userId - 用户ID
   * @param {Object} metadata - 元数据
   */
  async analyzeSearchPattern (userId, metadata) {
    // 分析用户搜索行为
    const { query, resultCount, selectedResult } = metadata

    // 记录搜索历史
    await this.db.collection('search_history').insertOne({
      userId,
      query,
      resultCount,
      selectedResult,
      timestamp: new Date()
    })

    // 提取关键词
    const keywords = query.split(/\s+/).filter(word => word.length > 1)

    // 更新用户关键词兴趣
    for (const keyword of keywords) {
      await this.db.collection('user_interests').updateOne(
        { userId, keyword },
        {
          $inc: { frequency: 1 },
          $set: { lastSearched: new Date() }
        },
        { upsert: true }
      )
    }

    // 分析用户兴趣主题
    const userInterests = await this.db.collection('user_interests').find({
      userId
    }).sort({ frequency: -1 }).limit(10).toArray()

    if (userInterests.length > 0) {
      const interestKeywords = userInterests.map(interest => interest.keyword)

      await this.db.collection('user_preferences').updateOne(
        { userId },
        {
          $set: {
            interestKeywords,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
    }
  }

  /**
   * 分析会话时长模式
   * @param {string} userId - 用户ID
   * @param {Object} metadata - 元数据
   */
  async analyzeSessionDurationPattern (userId, metadata) {
    // 分析用户使用时间模式
    const { sessionId, duration, timeOfDay } = metadata

    // 记录会话数据
    await this.db.collection('session_stats').insertOne({
      userId,
      sessionId,
      duration,
      timeOfDay,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date()
    })

    // 计算用户平均会话时长
    const sessions = await this.db.collection('session_stats').find({
      userId
    }).sort({ timestamp: -1 }).limit(10).toArray()

    if (sessions.length > 0) {
      const avgDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length

      // 计算最常用时段
      const timeDistribution = {}
      for (const session of sessions) {
        timeDistribution[session.timeOfDay] = (timeDistribution[session.timeOfDay] || 0) + 1
      }

      const preferredTime = Object.entries(timeDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([time]) => time)[0]

      await this.db.collection('user_preferences').updateOne(
        { userId },
        {
          $set: {
            averageSessionDuration: avgDuration,
            preferredTimeOfDay: preferredTime,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
    }
  }

  /**
   * 定期处理未处理的交互数据
   */
  async processPendingInteractions () {
    try {
      // 获取未处理的交互数据
      const pendingInteractions = await this.db.collection(this.userInteractionsCollection).find({
        processed: false
      }).limit(100).toArray()

      this.logger.info(`开始处理${pendingInteractions.length}条未处理的交互数据`)

      // 处理每条未处理的交互
      for (const interaction of pendingInteractions) {
        await this.processInteraction(interaction)
      }

      this.logger.info(`完成处理${pendingInteractions.length}条未处理的交互数据`)
    } catch (error) {
      this.logger.error(`处理未处理交互数据失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取用户的健康趋势和模式
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户健康趋势和模式
   */
  async getUserHealthTrends (userId) {
    try {
      // 获取用户的健康数据
      const healthData = await this.db.collection('health_data').find({
        userId
      }).sort({ timestamp: -1 }).limit(30).toArray()

      // 获取用户的声音诊断数据
      const voiceDiagnosisData = await this.db.collection('voice_analyses').find({
        userId
      }).sort({ timestamp: -1 }).limit(10).toArray()

      // 获取用户的洞察模式
      const insightPatterns = await this.db.collection(this.insightPatternCollection).find({
        userId,
        confidence: { $gt: 0.6 }
      }).sort({ createdAt: -1 }).limit(20).toArray()

      // 合并分析结果
      const trends = {
        voiceTrends: this.extractVoiceTrends(voiceDiagnosisData),
        healthMetricsTrends: this.extractHealthMetricsTrends(healthData),
        significantPatterns: insightPatterns.filter(p => p.confidence > 0.7)
      }

      return trends
    } catch (error) {
      this.logger.error(`获取用户健康趋势失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 提取声音趋势
   * @param {Array} voiceData - 声音诊断数据数组
   * @returns {Object} 声音趋势
   */
  extractVoiceTrends (voiceData) {
    if (voiceData.length < 3) {
      return { sufficient: false }
    }

    // 提取五音趋势
    const fiveTonesTrends = {}
    const tones = ['gong', 'shang', 'jue', 'zhi', 'yu']

    for (const tone of tones) {
      const values = voiceData.map(d => d.features?.fiveTones?.[tone] || 0)
      fiveTonesTrends[tone] = {
        trend: this.calculateTrend(values),
        currentValue: values[0],
        previousValue: values[1],
        change: values[0] - values[1]
      }
    }

    return {
      sufficient: true,
      fiveTonesTrends,
      recentAnalyses: voiceData.slice(0, 3)
    }
  }

  /**
   * 提取健康指标趋势
   * @param {Array} healthData - 健康数据数组
   * @returns {Object} 健康指标趋势
   */
  extractHealthMetricsTrends (healthData) {
    if (healthData.length < 5) {
      return { sufficient: false }
    }

    // 提取常见健康指标的趋势
    const metricsTrends = {}
    const metrics = ['sleepQuality', 'stressLevel', 'energyLevel', 'moodScore']

    for (const metric of metrics) {
      const values = healthData.map(d => d[metric] || 0)
      metricsTrends[metric] = {
        trend: this.calculateTrend(values),
        currentValue: values[0],
        previousValue: values[1],
        change: values[0] - values[1],
        average: values.reduce((sum, val) => sum + val, 0) / values.length
      }
    }

    return {
      sufficient: true,
      metricsTrends,
      recentData: healthData.slice(0, 5)
    }
  }

  /**
   * 生成个性化的健康洞察
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 个性化健康洞察数组
   */
  async generatePersonalizedInsights (userId) {
    try {
      // 获取用户健康趋势
      const healthTrends = await this.getUserHealthTrends(userId)

      // 如果数据不足，返回空数组
      if (!healthTrends.voiceTrends.sufficient && !healthTrends.healthMetricsTrends.sufficient) {
        return []
      }

      const insights = []

      // 根据声音趋势生成洞察
      if (healthTrends.voiceTrends.sufficient) {
        const { fiveTonesTrends } = healthTrends.voiceTrends

        // 对每个音调检查变化
        for (const [tone, data] of Object.entries(fiveTonesTrends)) {
          if (Math.abs(data.change) > 0.15) {
            const organMap = {
              gong: '脾',
              shang: '肺',
              jue: '肝',
              zhi: '心',
              yu: '肾'
            }

            insights.push({
              type: 'voice_tone_change',
              title: `${organMap[tone]}功能变化`,
              description: data.change > 0
                ? `您的${tone}音(${organMap[tone]})特征有所增强，可能表明${organMap[tone]}功能改善。`
                : `您的${tone}音(${organMap[tone]})特征有所减弱，建议关注${organMap[tone]}功能。`,
              confidenceScore: Math.min(0.85, Math.abs(data.change) * 2),
              relevantData: data,
              createdAt: new Date()
            })
          }
        }
      }

      // 根据健康指标趋势生成洞察
      if (healthTrends.healthMetricsTrends.sufficient) {
        const { metricsTrends } = healthTrends.healthMetricsTrends

        // 对每个健康指标检查变化
        for (const [metric, data] of Object.entries(metricsTrends)) {
          if (Math.abs(data.change) > 0.2) {
            const metricNameMap = {
              sleepQuality: '睡眠质量',
              stressLevel: '压力水平',
              energyLevel: '能量水平',
              moodScore: '情绪状态'
            }

            insights.push({
              type: 'health_metric_change',
              title: `${metricNameMap[metric]}变化`,
              description: (metric === 'stressLevel' ? data.change < 0 : data.change > 0)
                ? `您的${metricNameMap[metric]}有所改善，继续保持当前的健康习惯。`
                : `您的${metricNameMap[metric]}有所下降，建议关注相关因素的影响。`,
              confidenceScore: Math.min(0.8, Math.abs(data.change) * 1.5),
              relevantData: data,
              createdAt: new Date()
            })
          }
        }
      }

      // 结合洞察模式
      if (healthTrends.significantPatterns && healthTrends.significantPatterns.length > 0) {
        for (const pattern of healthTrends.significantPatterns) {
          insights.push({
            type: 'insight_pattern',
            title: `健康模式识别: ${pattern.patternType}`,
            description: pattern.description,
            confidenceScore: pattern.confidence,
            relevantData: pattern,
            createdAt: new Date()
          })
        }
      }

      // 按置信度排序
      return insights.sort((a, b) => b.confidenceScore - a.confidenceScore)
    } catch (error) {
      this.logger.error(`生成个性化洞察失败: ${error.message}`)
      throw error
    }
  }
}

module.exports = EnhancedAdaptiveLearningService
