/**
 * 自适应学习系统定时任务
 */
class AdaptiveLearningScheduler {
  constructor (dependencies) {
    this.adaptiveLearningService = dependencies.adaptiveLearningService
    this.logger = dependencies.logger
    this.db = dependencies.db
  }

  /**
   * 初始化定时任务
   */
  initialize () {
    this.logger.info('初始化自适应学习定时任务')

    // 设置定时任务
    this.setupHourlyTask()
    this.setupDailyTask()
    this.setupWeeklyTask()

    this.logger.info('自适应学习定时任务初始化完成')
  }

  /**
   * 设置每小时执行的任务
   */
  setupHourlyTask () {
    // 使用setTimeout循环来模拟cron作业
    const runHourlyTask = async () => {
      try {
        this.logger.info('执行自适应学习系统小时任务')

        // 处理未处理的交互数据
        await this.adaptiveLearningService.processPendingInteractions()

        this.logger.info('自适应学习系统小时任务完成')
      } catch (error) {
        this.logger.error(`自适应学习系统小时任务失败: ${error.message}`)
      }

      // 设置下一次执行
      setTimeout(runHourlyTask, 60 * 60 * 1000) // 1小时
    }

    // 启动第一次执行
    setTimeout(runHourlyTask, 5 * 60 * 1000) // 启动5分钟后开始
  }

  /**
   * 设置每日执行的任务
   */
  setupDailyTask () {
    const runDailyTask = async () => {
      try {
        this.logger.info('执行自适应学习系统每日任务')

        // 生成每日系统性能报告
        await this.generateSystemPerformanceReport()

        // 更新用户兴趣模型
        await this.updateUserInterestModels()

        this.logger.info('自适应学习系统每日任务完成')
      } catch (error) {
        this.logger.error(`自适应学习系统每日任务失败: ${error.message}`)
      }

      // 计算明天凌晨3点的时间间隔
      const now = new Date()
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        3, 0, 0
      )
      const timeUntilTomorrow = tomorrow.getTime() - now.getTime()

      // 设置下一次执行
      setTimeout(runDailyTask, timeUntilTomorrow)
    }

    // 计算今天凌晨3点或明天凌晨3点的时间间隔
    const now = new Date()
    const today3am = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      3, 0, 0
    )
    let timeUntilRun = today3am.getTime() - now.getTime()

    // 如果已经过了今天3点，则设置为明天3点
    if (timeUntilRun < 0) {
      timeUntilRun += 24 * 60 * 60 * 1000
    }

    // 启动第一次执行
    setTimeout(runDailyTask, timeUntilRun)
  }

  /**
   * 设置每周执行的任务
   */
  setupWeeklyTask () {
    const runWeeklyTask = async () => {
      try {
        this.logger.info('执行自适应学习系统每周任务')

        // 模型优化和版本更新
        await this.optimizeAndVersionModels()

        // 生成每周系统学习报告
        await this.generateWeeklyLearningReport()

        this.logger.info('自适应学习系统每周任务完成')
      } catch (error) {
        this.logger.error(`自适应学习系统每周任务失败: ${error.message}`)
      }

      // 设置下一次执行（每周一凌晨4点）
      const now = new Date()
      const daysUntilMonday = 1 - now.getDay()
      const nextMonday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday),
        4, 0, 0
      )
      const timeUntilNextMonday = nextMonday.getTime() - now.getTime()

      // 设置下一次执行
      setTimeout(runWeeklyTask, timeUntilNextMonday)
    }

    // 计算下一个周一凌晨4点的时间间隔
    const now = new Date()
    const daysUntilMonday = 1 - now.getDay()
    const nextMonday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday),
      4, 0, 0
    )
    const timeUntilNextMonday = nextMonday.getTime() - now.getTime()

    // 启动第一次执行
    setTimeout(runWeeklyTask, timeUntilNextMonday)
  }

  /**
   * 生成系统性能报告
   */
  async generateSystemPerformanceReport () {
    try {
      // 收集诊断准确率数据
      const diagnosisAccuracy = await this.calculateDiagnosisAccuracy()

      // 收集推荐满意度数据
      const recommendationSatisfaction = await this.calculateRecommendationSatisfaction()

      // 收集模式识别准确率数据
      const patternRecognitionAccuracy = await this.calculatePatternRecognitionAccuracy()

      // 生成报告
      const report = {
        date: new Date().toISOString().split('T')[0],
        diagnosisAccuracy,
        recommendationSatisfaction,
        patternRecognitionAccuracy,
        createdAt: new Date()
      }

      // 存储报告
      await this.db.collection('system_performance_reports').insertOne(report)

      this.logger.info(`生成系统性能报告完成: ${report.date}`)
      return report
    } catch (error) {
      this.logger.error(`生成系统性能报告失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 计算诊断准确率
   */
  async calculateDiagnosisAccuracy () {
    // 获取最近7天内有专家验证的诊断数据
    const recentValidations = await this.db.collection('diagnosis_results').find({
      expertValidation: { $exists: true },
      validatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).toArray()

    if (recentValidations.length === 0) {
      return { accuracy: null, sampleSize: 0 }
    }

    // 计算准确率
    const accurateCount = recentValidations.filter(v => v.expertValidation === 'accurate').length
    const accuracy = accurateCount / recentValidations.length

    return {
      accuracy,
      sampleSize: recentValidations.length,
      details: {
        accurate: accurateCount,
        inaccurate: recentValidations.length - accurateCount
      }
    }
  }

  /**
   * 计算推荐满意度
   */
  async calculateRecommendationSatisfaction () {
    // 获取最近7天内有用户评分的推荐数据
    const recentRatings = await this.db.collection('recommendations').find({
      userRating: { $exists: true },
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).toArray()

    if (recentRatings.length === 0) {
      return { satisfaction: null, sampleSize: 0 }
    }

    // 计算满意度（假设评分范围为1-5）
    const totalRating = recentRatings.reduce((sum, r) => sum + r.userRating, 0)
    const averageRating = totalRating / recentRatings.length
    const satisfaction = averageRating / 5 // 转换为0-1的比例

    // 评分分布
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }

    for (const rating of recentRatings) {
      ratingDistribution[rating.userRating] += 1
    }

    return {
      satisfaction,
      averageRating,
      sampleSize: recentRatings.length,
      distribution: ratingDistribution
    }
  }

  /**
   * 计算模式识别准确率
   */
  async calculatePatternRecognitionAccuracy () {
    // 获取最近7天内有专家验证的模式数据
    const recentPatternValidations = await this.db.collection('insight_patterns').find({
      expertValidation: { $exists: true },
      validatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).toArray()

    if (recentPatternValidations.length === 0) {
      return { accuracy: null, sampleSize: 0 }
    }

    // 计算准确率
    const validCount = recentPatternValidations.filter(p => p.expertValidation === 'valid').length
    const accuracy = validCount / recentPatternValidations.length

    // 按模式类型分组
    const accuracyByType = {}
    const patternTypes = [...new Set(recentPatternValidations.map(p => p.patternType))]

    for (const type of patternTypes) {
      const patternsOfType = recentPatternValidations.filter(p => p.patternType === type)
      const validOfType = patternsOfType.filter(p => p.expertValidation === 'valid').length

      accuracyByType[type] = {
        accuracy: validOfType / patternsOfType.length,
        sampleSize: patternsOfType.length
      }
    }

    return {
      accuracy,
      sampleSize: recentPatternValidations.length,
      byType: accuracyByType
    }
  }

  /**
   * 更新用户兴趣模型
   */
  async updateUserInterestModels () {
    try {
      // 获取活跃用户
      const activeUsers = await this.db.collection('user_interactions').aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$userId',
            interactionCount: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        {
          $match: {
            interactionCount: { $gt: 5 }
          }
        }
      ]).toArray()

      this.logger.info(`更新${activeUsers.length}位活跃用户的兴趣模型`)

      // 更新每个用户的兴趣模型
      for (const user of activeUsers) {
        await this.updateUserInterestModel(user._id)
      }

      this.logger.info('用户兴趣模型更新完成')
    } catch (error) {
      this.logger.error(`更新用户兴趣模型失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 更新单个用户的兴趣模型
   * @param {string} userId - 用户ID
   */
  async updateUserInterestModel (userId) {
    try {
      // 获取用户的各种数据
      const interactions = await this.db.collection('user_interactions').find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).toArray()

      const searchHistory = await this.db.collection('search_history').find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).toArray()

      const feedbacks = await this.db.collection('feedback_loop').find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).toArray()

      // 提取兴趣关键词
      const keywords = this.extractUserInterestKeywords(interactions, searchHistory, feedbacks)

      // 更新用户兴趣模型
      await this.db.collection('user_interest_models').updateOne(
        { userId },
        {
          $set: {
            interestKeywords: keywords,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
    } catch (error) {
      this.logger.error(`更新用户${userId}兴趣模型失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 提取用户兴趣关键词
   * @param {Array} interactions - 用户交互数据
   * @param {Array} searchHistory - 搜索历史
   * @param {Array} feedbacks - 反馈数据
   * @returns {Array} 兴趣关键词及权重
   */
  extractUserInterestKeywords (interactions, searchHistory, feedbacks) {
    // 关键词权重映射
    const keywordWeights = {}

    // 从搜索历史中提取关键词
    for (const search of searchHistory) {
      const keywords = search.query.split(/\s+/).filter(word => word.length > 1)

      for (const keyword of keywords) {
        keywordWeights[keyword] = (keywordWeights[keyword] || 0) + 1
      }
    }

    // 从交互数据中提取关键词
    for (const interaction of interactions) {
      if (interaction.interactionType === 'page_view' && interaction.metadata && interaction.metadata.keywords) {
        for (const keyword of interaction.metadata.keywords) {
          keywordWeights[keyword] = (keywordWeights[keyword] || 0) + 0.5
        }
      }
    }

    // 从反馈数据中提取关键词
    for (const feedback of feedbacks) {
      if (feedback.comments) {
        const keywords = feedback.comments.split(/\s+/).filter(word => word.length > 1)

        for (const keyword of keywords) {
          keywordWeights[keyword] = (keywordWeights[keyword] || 0) + 0.8
        }
      }
    }

    // 按权重排序并返回前20个关键词
    return Object.entries(keywordWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, weight]) => ({
        keyword,
        weight
      }))
  }

  /**
   * 优化和版本化模型
   */
  async optimizeAndVersionModels () {
    try {
      // 获取所有活跃模型
      const activeModels = await this.db.collection('learning_models').find({
        status: 'active'
      }).toArray()

      this.logger.info(`开始优化${activeModels.length}个模型`)

      for (const model of activeModels) {
        // 检查模型是否需要优化
        const needsOptimization = await this.checkModelOptimizationNeed(model)

        if (needsOptimization) {
          await this.optimizeAndVersionModel(model)
        } else {
          this.logger.info(`模型${model.modelType}不需要优化`)
        }
      }

      this.logger.info('模型优化和版本化完成')
    } catch (error) {
      this.logger.error(`模型优化和版本化失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 检查模型是否需要优化
   * @param {Object} model - 模型对象
   * @returns {boolean} 是否需要优化
   */
  async checkModelOptimizationNeed (model) {
    // 检查模型参数更新频率
    const parameterUpdates = await this.db.collection('rule_application_logs').find({
      'actionParams.modelType': model.modelType,
      appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).count()

    // 如果一周内参数更新超过10次，考虑优化模型
    if (parameterUpdates > 10) {
      return true
    }

    // 检查模型性能
    if (model.modelType === 'voice_feature_adaptation') {
      // 检查声音诊断准确率
      const accuracy = await this.calculateVoiceDiagnosisAccuracy()

      // 如果准确率低于0.7，考虑优化模型
      if (accuracy && accuracy < 0.7) {
        return true
      }
    }

    // 检查模型版本时间
    const versionAge = Date.now() - new Date(model.updatedAt).getTime()
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000

    // 如果模型版本超过一个月，考虑优化更新
    if (versionAge > oneMonthInMs) {
      return true
    }

    return false
  }

  /**
   * 优化并创建新版本模型
   * @param {Object} model - 当前模型对象
   */
  async optimizeAndVersionModel (model) {
    try {
      this.logger.info(`开始优化模型: ${model.modelType}`)

      // 创建新版本号
      const currentVersion = model.version
      const versionParts = currentVersion.split('.')
      const newVersion = `${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2]) + 1}`

      // 优化模型参数 - 这里是简化示例，实际可能需要更复杂的优化逻辑
      const optimizedParameters = await this.getOptimizedParameters(model)

      // 创建新版本模型
      const newModel = {
        ...model,
        _id: undefined, // 不复制ID，让MongoDB生成新ID
        version: newVersion,
        parameters: optimizedParameters,
        previousVersion: currentVersion,
        optimizationNotes: `从v${currentVersion}优化`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 插入新模型
      await this.db.collection('learning_models').insertOne(newModel)

      // 将旧模型标记为非活跃
      await this.db.collection('learning_models').updateOne(
        { _id: model._id },
        { $set: { status: 'inactive', inactivatedAt: new Date() } }
      )

      this.logger.info(`模型${model.modelType}优化完成，新版本: ${newVersion}`)
    } catch (error) {
      this.logger.error(`优化模型${model.modelType}失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取优化后的模型参数
   * @param {Object} model - 当前模型对象
   * @returns {Object} 优化后的参数
   */
  async getOptimizedParameters (model) {
    // 深拷贝当前参数
    const optimizedParams = JSON.parse(JSON.stringify(model.parameters))

    // 根据模型类型进行特定优化
    if (model.modelType === 'voice_feature_adaptation') {
      // 获取高质量样本中的特征重要性
      const highQualitySamples = await this.db.collection('voice_analyses').find({
        isTrainingExample: true,
        expertVerified: true
      }).sort({ createdAt: -1 }).limit(50).toArray()

      if (highQualitySamples.length > 0) {
        // 分析关键特征
        const featureImportance = this.analyzeFeatureImportance(highQualitySamples)

        // 更新特征重要性，但保留一定的原始权重
        const originalWeight = 0.3

        for (const feature in optimizedParams.featureImportance) {
          if (featureImportance[feature]) {
            optimizedParams.featureImportance[feature] =
              originalWeight * optimizedParams.featureImportance[feature] +
              (1 - originalWeight) * featureImportance[feature]
          }
        }

        // 归一化
        const sum = Object.values(optimizedParams.featureImportance).reduce((a, b) => a + b, 0)
        for (const feature in optimizedParams.featureImportance) {
          optimizedParams.featureImportance[feature] /= sum
        }
      }
    }

    return optimizedParams
  }

  /**
   * 分析特征重要性
   * @param {Array} samples - 样本数组
   * @returns {Object} 特征重要性映射
   */
  analyzeFeatureImportance (samples) {
    const featureImportance = {}

    // 统计每个特征在样本中的频率
    for (const sample of samples) {
      if (sample.keyFeatures) {
        for (const feature of sample.keyFeatures) {
          featureImportance[feature] = (featureImportance[feature] || 0) + 1
        }
      }
    }

    // 归一化
    const total = Object.values(featureImportance).reduce((sum, count) => sum + count, 0)

    if (total > 0) {
      for (const feature in featureImportance) {
        featureImportance[feature] /= total
      }
    }

    return featureImportance
  }

  /**
   * 计算声音诊断准确率
   * @returns {number} 准确率
   */
  async calculateVoiceDiagnosisAccuracy () {
    // 获取最近验证的声音诊断
    const validations = await this.db.collection('voice_analyses').find({
      expertValidation: { $exists: true },
      validatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).toArray()

    if (validations.length === 0) {
      return null
    }

    const accurateCount = validations.filter(v => v.expertValidation === 'accurate').length
    return accurateCount / validations.length
  }

  /**
   * 生成每周学习报告
   */
  async generateWeeklyLearningReport () {
    try {
      // 获取系统性能数据
      const performanceData = await this.getWeeklyPerformanceData()

      // 获取用户交互统计
      const interactionStats = await this.getWeeklyInteractionStats()

      // 获取模型更新统计
      const modelUpdateStats = await this.getWeeklyModelUpdateStats()

      // 生成报告
      const report = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        performanceData,
        interactionStats,
        modelUpdateStats,
        createdAt: new Date()
      }

      // 存储报告
      await this.db.collection('learning_reports').insertOne(report)

      this.logger.info(`生成每周学习报告完成: ${report.startDate} to ${report.endDate}`)
      return report
    } catch (error) {
      this.logger.error(`生成每周学习报告失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取每周性能数据
   */
  async getWeeklyPerformanceData () {
    // 获取最近7天的每日性能报告
    const reports = await this.db.collection('system_performance_reports').find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: 1 }).toArray()

    // 如果没有报告，返回空对象
    if (reports.length === 0) {
      return {}
    }

    // 计算平均性能
    const diagnosisAccuracies = reports
      .filter(r => r.diagnosisAccuracy && r.diagnosisAccuracy.accuracy !== null)
      .map(r => r.diagnosisAccuracy.accuracy)

    const recommendationSatisfactions = reports
      .filter(r => r.recommendationSatisfaction && r.recommendationSatisfaction.satisfaction !== null)
      .map(r => r.recommendationSatisfaction.satisfaction)

    const patternAccuracies = reports
      .filter(r => r.patternRecognitionAccuracy && r.patternRecognitionAccuracy.accuracy !== null)
      .map(r => r.patternRecognitionAccuracy.accuracy)

    // 计算平均值和趋势
    const avgDiagnosisAccuracy = diagnosisAccuracies.length > 0
      ? diagnosisAccuracies.reduce((sum, acc) => sum + acc, 0) / diagnosisAccuracies.length
      : null

    const avgRecommendationSatisfaction = recommendationSatisfactions.length > 0
      ? recommendationSatisfactions.reduce((sum, sat) => sum + sat, 0) / recommendationSatisfactions.length
      : null

    const avgPatternAccuracy = patternAccuracies.length > 0
      ? patternAccuracies.reduce((sum, acc) => sum + acc, 0) / patternAccuracies.length
      : null

    // 计算趋势
    const diagnosisTrend = diagnosisAccuracies.length >= 2
      ? diagnosisAccuracies[diagnosisAccuracies.length - 1] - diagnosisAccuracies[0]
      : null

    const recommendationTrend = recommendationSatisfactions.length >= 2
      ? recommendationSatisfactions[recommendationSatisfactions.length - 1] - recommendationSatisfactions[0]
      : null

    const patternTrend = patternAccuracies.length >= 2
      ? patternAccuracies[patternAccuracies.length - 1] - patternAccuracies[0]
      : null

    return {
      diagnosisAccuracy: {
        average: avgDiagnosisAccuracy,
        trend: diagnosisTrend,
        values: diagnosisAccuracies
      },
      recommendationSatisfaction: {
        average: avgRecommendationSatisfaction,
        trend: recommendationTrend,
        values: recommendationSatisfactions
      },
      patternRecognitionAccuracy: {
        average: avgPatternAccuracy,
        trend: patternTrend,
        values: patternAccuracies
      }
    }
  }

  /**
   * 获取每周交互统计
   */
  async getWeeklyInteractionStats () {
    // 获取最近7天的交互数据统计
    const stats = await this.db.collection('user_interactions').aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            interactionType: '$interactionType',
            dataSource: '$dataSource'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          interactionType: '$_id.interactionType',
          dataSource: '$_id.dataSource',
          count: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ]).toArray()

    // 获取每日交互趋势
    const dailyTrends = await this.db.collection('user_interactions').aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            interactionType: '$interactionType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          interactions: {
            $push: {
              type: '$_id.interactionType',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray()

    // 统计每种类型交互的总数
    const interactionTypeCounts = {}
    for (const stat of stats) {
      const type = stat.interactionType
      interactionTypeCounts[type] = (interactionTypeCounts[type] || 0) + stat.count
    }

    // 统计每个数据源的交互数
    const dataSourceCounts = {}
    for (const stat of stats) {
      const source = stat.dataSource
      if (source) {
        dataSourceCounts[source] = (dataSourceCounts[source] || 0) + stat.count
      }
    }

    // 获取用户参与统计
    const userEngagementStats = await this.db.collection('user_interactions').aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$userId',
          interactionCount: { $sum: 1 },
          firstInteraction: { $min: '$timestamp' },
          lastInteraction: { $max: '$timestamp' },
          interactionTypes: { $addToSet: '$interactionType' }
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          interactionCount: 1,
          engagementDuration: {
            $divide: [
              { $subtract: ['$lastInteraction', '$firstInteraction'] },
              1000 * 60 // 转换为分钟
            ]
          },
          uniqueInteractionTypes: { $size: '$interactionTypes' }
        }
      }
    ]).toArray()

    // 计算用户参与度指标
    const userCount = userEngagementStats.length
    const highlyEngagedUsers = userEngagementStats.filter(u => u.interactionCount > 10).length
    const avgInteractionsPerUser = userEngagementStats.reduce((sum, u) => sum + u.interactionCount, 0) / userCount

    return {
      totalInteractions: stats.reduce((sum, stat) => sum + stat.count, 0),
      uniqueUsers: new Set(stats.flatMap(stat => stat.uniqueUsers || [])).size,
      interactionsByType: interactionTypeCounts,
      interactionsBySource: dataSourceCounts,
      dailyTrends,
      userEngagement: {
        userCount,
        highlyEngagedUsers,
        highlyEngagedPercentage: (highlyEngagedUsers / userCount) * 100,
        avgInteractionsPerUser
      }
    }
  }

  /**
   * 获取每周模型更新统计
   */
  async getWeeklyModelUpdateStats () {
    // 获取模型更新日志
    const modelUpdates = await this.db.collection('learning_models').find({
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).toArray()

    // 获取规则应用日志
    const ruleApplications = await this.db.collection('rule_application_logs').find({
      appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).toArray()

    // 统计每个模型类型的更新次数
    const updatesByModelType = {}
    for (const update of modelUpdates) {
      const type = update.modelType
      updatesByModelType[type] = (updatesByModelType[type] || 0) + 1
    }

    // 统计每种规则类型的应用次数
    const ruleTypeApplications = {}
    for (const application of ruleApplications) {
      const type = application.ruleType || 'unknown'
      ruleTypeApplications[type] = (ruleTypeApplications[type] || 0) + 1
    }

    // 获取新创建的模型版本
    const newVersions = await this.db.collection('learning_models').find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      previousVersion: { $exists: true }
    }).toArray()

    return {
      totalModelUpdates: modelUpdates.length,
      updatesByModelType,
      totalRuleApplications: ruleApplications.length,
      ruleTypeApplications,
      newModelVersions: newVersions.map(v => ({
        modelType: v.modelType,
        version: v.version,
        previousVersion: v.previousVersion,
        createdAt: v.createdAt
      }))
    }
  }
}

module.exports = AdaptiveLearningScheduler
