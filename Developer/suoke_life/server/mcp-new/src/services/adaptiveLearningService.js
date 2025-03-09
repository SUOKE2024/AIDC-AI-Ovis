/**
 * @fileoverview 自适应学习服务，实现协同过滤和自适应推荐算法
 */

const fs = require('fs-extra')
const path = require('path')
const logger = require('./loggerService')

/**
 * 自适应学习服务类
 */
class AdaptiveLearningService {
  /**
   * 创建自适应学习服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {Object} options.userHealthProfileService - 用户健康画像服务实例
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'adaptive_learning')
    this.modelDataDir = path.join(this.dataDir, 'models')
    this.userSimilarityDir = path.join(this.dataDir, 'user_similarity')
    this.userHealthProfileService = options.userHealthProfileService

    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  async _initService () {
    try {
      // 确保目录存在
      await fs.ensureDir(this.modelDataDir)
      await fs.ensureDir(this.userSimilarityDir)

      logger.info('自适应学习服务初始化完成')
    } catch (error) {
      logger.error('自适应学习服务初始化失败', error)
    }
  }

  /**
   * 基于用户之间的相似度实现协同过滤推荐
   * @param {string} userId - 用户ID
   * @param {Array} candidateRecommendations - 候选推荐项列表
   * @param {Object} options - 选项
   * @param {boolean} options.useCollaborative - 是否使用协同过滤
   * @param {number} options.similarUserLimit - 相似用户数量限制
   * @returns {Promise<Array>} 重新排序后的推荐列表
   */
  async collaborativeFilterRecommendations (userId, candidateRecommendations, options = {}) {
    const { useCollaborative = true, similarUserLimit = 10 } = options

    // 如果不启用协同过滤或没有候选推荐项，直接返回原列表
    if (!useCollaborative || !candidateRecommendations || candidateRecommendations.length === 0) {
      return candidateRecommendations
    }

    try {
      // 查找相似用户
      const similarUsers = await this._findSimilarUsers(userId, similarUserLimit)

      // 如果没有相似用户，直接返回原列表
      if (similarUsers.length === 0) {
        return candidateRecommendations
      }

      // 获取相似用户的反馈数据
      const userFeedback = []
      for (const user of similarUsers) {
        const feedback = await this.userHealthProfileService.getUserFeedback(user.userId, { limit: 50 })
        userFeedback.push({
          userId: user.userId,
          similarity: user.similarity,
          feedback
        })
      }

      // 计算每个推荐项的协同过滤分数
      const scoredRecommendations = candidateRecommendations.map(recommendation => {
        // 基础分数
        const score = recommendation.score || 0
        let collaborativeScore = 0
        let totalWeight = 0

        // 查找相似用户对相似推荐的反馈
        userFeedback.forEach(user => {
          // 查找相似用户对相似推荐的反馈
          const similarRecommendations = this._findSimilarRecommendations(
            recommendation,
            user.feedback
          )

          // 如果找到相似的推荐，计算加权分数
          if (similarRecommendations.length > 0) {
            const userWeight = user.similarity
            totalWeight += userWeight

            // 计算该用户对相似推荐的平均评分
            const avgFeedbackScore = similarRecommendations.reduce((sum, item) => {
              // 将反馈类型转换为分数
              let feedbackScore = 0
              if (item.feedbackType === 'like') feedbackScore = 1
              else if (item.feedbackType === 'dislike') feedbackScore = -1
              return sum + feedbackScore
            }, 0) / similarRecommendations.length

            collaborativeScore += avgFeedbackScore * userWeight
          }
        })

        // 如果有足够的相似用户反馈，调整分数
        if (totalWeight > 0) {
          collaborativeScore = collaborativeScore / totalWeight

          // 最终分数是原始分数和协同过滤分数的加权组合
          // 协同过滤分数范围是-1到1，将其映射到-20到20分的调整
          const adjustedScore = score + collaborativeScore * 20

          return {
            ...recommendation,
            score: adjustedScore,
            collaborativeAdjustment: collaborativeScore * 20
          }
        }

        return recommendation
      })

      // 按分数排序
      return scoredRecommendations.sort((a, b) => b.score - a.score)
    } catch (error) {
      logger.error('协同过滤推荐失败', { userId, error: error.message })
      return candidateRecommendations
    }
  }

  /**
   * 查找和当前推荐相似的推荐项
   * @private
   * @param {Object} currentRecommendation - 当前推荐项
   * @param {Array} userFeedback - 用户反馈列表
   * @returns {Array} 相似的推荐项
   */
  _findSimilarRecommendations (currentRecommendation, userFeedback) {
    // 如果没有用户反馈，返回空数组
    if (!userFeedback || userFeedback.length === 0) {
      return []
    }

    // 提取当前推荐的特征
    const currentFeatures = this._extractRecommendationFeatures(currentRecommendation)

    // 查找相似的推荐
    return userFeedback.filter(feedback => {
      const feedbackFeatures = this._extractRecommendationFeatures(feedback)
      const similarity = this._calculateFeatureSimilarity(currentFeatures, feedbackFeatures)
      return similarity > 0.5 // 只保留相似度大于0.5的推荐
    })
  }

  /**
   * 从推荐中提取特征
   * @private
   * @param {Object} recommendation - 推荐项
   * @returns {Object} 特征集合
   */
  _extractRecommendationFeatures (recommendation) {
    const features = {
      type: recommendation.type || '',
      diagnosis: '',
      constitutions: [],
      symptoms: [],
      herbs: [],
      foods: []
    }

    // 从sourceData提取体质诊断
    if (recommendation.sourceData && recommendation.sourceData.diagnosis) {
      features.diagnosis = recommendation.sourceData.diagnosis
    }

    // 从详情提取特征
    if (recommendation.details) {
      // 提取体质
      if (recommendation.details.constitution) {
        features.constitutions.push(recommendation.details.constitution)
      }

      // 提取症状
      if (recommendation.details.symptoms && Array.isArray(recommendation.details.symptoms)) {
        features.symptoms = recommendation.details.symptoms
      }

      // 提取药材
      if (recommendation.details.herbs && Array.isArray(recommendation.details.herbs)) {
        features.herbs = recommendation.details.herbs
      }

      // 提取食材
      if (recommendation.details.ingredients && Array.isArray(recommendation.details.ingredients)) {
        features.foods = recommendation.details.ingredients
      }
    }

    // 从推荐中提取药材
    if (recommendation.recommendations && recommendation.recommendations.herbs) {
      const herbs = recommendation.recommendations.herbs.map(herb =>
        typeof herb === 'string' ? herb : herb.content
      )
      features.herbs = [...new Set([...features.herbs, ...herbs])]
    }

    // 从推荐中提取食材
    if (recommendation.recommendations && recommendation.recommendations.diet) {
      const foods = recommendation.recommendations.diet.map(food =>
        typeof food === 'string' ? food : food.content
      )
      features.foods = [...new Set([...features.foods, ...foods])]
    }

    return features
  }

  /**
   * 计算特征相似度
   * @private
   * @param {Object} features1 - 特征集合1
   * @param {Object} features2 - 特征集合2
   * @returns {number} 相似度(0-1)
   */
  _calculateFeatureSimilarity (features1, features2) {
    // 类型相似度
    const typeSimilarity = features1.type === features2.type ? 1 : 0

    // 诊断相似度
    const diagnosisSimilarity = features1.diagnosis === features2.diagnosis ? 1 : 0

    // 体质相似度
    const constitutionSimilarity = this._calculateArrayOverlap(
      features1.constitutions,
      features2.constitutions
    )

    // 症状相似度
    const symptomSimilarity = this._calculateArrayOverlap(
      features1.symptoms,
      features2.symptoms
    )

    // 药材相似度
    const herbSimilarity = this._calculateArrayOverlap(
      features1.herbs,
      features2.herbs
    )

    // 食材相似度
    const foodSimilarity = this._calculateArrayOverlap(
      features1.foods,
      features2.foods
    )

    // 计算加权相似度
    const weights = {
      type: 0.1,
      diagnosis: 0.2,
      constitution: 0.3,
      symptom: 0.2,
      herb: 0.1,
      food: 0.1
    }

    return (
      typeSimilarity * weights.type +
      diagnosisSimilarity * weights.diagnosis +
      constitutionSimilarity * weights.constitution +
      symptomSimilarity * weights.symptom +
      herbSimilarity * weights.herb +
      foodSimilarity * weights.food
    )
  }

  /**
   * 计算数组重叠度
   * @private
   * @param {Array} array1 - 数组1
   * @param {Array} array2 - 数组2
   * @returns {number} 重叠度(0-1)
   */
  _calculateArrayOverlap (array1, array2) {
    if (!array1 || !array2 || array1.length === 0 || array2.length === 0) {
      return 0
    }

    const set1 = new Set(array1)
    const set2 = new Set(array2)

    // 计算交集大小
    const intersection = new Set([...set1].filter(x => set2.has(x)))

    // 计算并集大小
    const union = new Set([...set1, ...set2])

    // 返回Jaccard相似度
    return intersection.size / union.size
  }

  /**
   * 查找相似用户
   * @private
   * @param {string} userId - 用户ID
   * @param {number} limit - 限制返回数量
   * @returns {Promise<Array>} 相似用户列表
   */
  async _findSimilarUsers (userId, limit) {
    try {
      // 获取当前用户的健康画像
      const userProfile = await this.userHealthProfileService.getUserHealthProfile(userId)

      // 获取所有用户列表
      const userSimilarityPath = path.join(this.userSimilarityDir, `${userId}.json`)

      // 如果已有相似用户缓存，直接返回
      if (await fs.pathExists(userSimilarityPath)) {
        const cachedData = await fs.readJson(userSimilarityPath)

        // 检查缓存是否过期（3天）
        const cacheTime = new Date(cachedData.timestamp)
        const now = new Date()
        const cacheAgeDays = (now - cacheTime) / (1000 * 60 * 60 * 24)

        if (cacheAgeDays < 3) {
          return cachedData.similarUsers.slice(0, limit)
        }
      }

      // 获取所有用户的健康画像
      const profilesDir = path.join(process.cwd(), 'data', 'user_profiles', 'health_profiles')
      const allUserProfiles = []

      if (await fs.pathExists(profilesDir)) {
        const files = await fs.readdir(profilesDir)

        for (const file of files) {
          if (file.endsWith('.json')) {
            const otherUserId = file.replace('.json', '')

            // 排除当前用户
            if (otherUserId !== userId) {
              const profilePath = path.join(profilesDir, file)
              const profile = await fs.readJson(profilePath)
              allUserProfiles.push(profile)
            }
          }
        }
      }

      // 计算相似度
      const similarUsers = allUserProfiles.map(profile => {
        const similarity = this._calculateUserSimilarity(userProfile, profile)
        return {
          userId: profile.userId,
          similarity
        }
      })

      // 按相似度排序
      similarUsers.sort((a, b) => b.similarity - a.similarity)

      // 缓存结果
      await fs.writeJson(userSimilarityPath, {
        userId,
        timestamp: new Date().toISOString(),
        similarUsers
      }, { spaces: 2 })

      // 返回指定数量的相似用户
      return similarUsers.slice(0, limit)
    } catch (error) {
      logger.error('查找相似用户失败', { userId, error: error.message })
      return []
    }
  }

  /**
   * 计算用户相似度
   * @private
   * @param {Object} userProfile1 - 用户1的健康画像
   * @param {Object} userProfile2 - 用户2的健康画像
   * @returns {number} 相似度(0-1)
   */
  _calculateUserSimilarity (userProfile1, userProfile2) {
    // 体质相似度
    let constitutionSimilarity = 0
    if (userProfile1.constitution && userProfile2.constitution) {
      // 主体质相似度
      if (userProfile1.constitution.primary && userProfile2.constitution.primary) {
        constitutionSimilarity += userProfile1.constitution.primary === userProfile2.constitution.primary ? 1 : 0
      }

      // 次要体质相似度
      if (userProfile1.constitution.secondary && userProfile2.constitution.secondary) {
        constitutionSimilarity += this._calculateArrayOverlap(
          userProfile1.constitution.secondary,
          userProfile2.constitution.secondary
        )
      }

      // 归一化体质相似度
      constitutionSimilarity = constitutionSimilarity / 2
    }

    // 症状相似度
    const symptomSimilarity = this._calculateArrayOverlap(
      userProfile1.symptoms || [],
      userProfile2.symptoms || []
    )

    // 健康指标相似度
    const metricsScores = []
    if (userProfile1.healthMetrics && userProfile2.healthMetrics) {
      // 比较各项指标
      const metrics = ['age', 'weight', 'height', 'bmi']
      metrics.forEach(metric => {
        if (userProfile1.healthMetrics[metric] && userProfile2.healthMetrics[metric]) {
          const value1 = parseFloat(userProfile1.healthMetrics[metric])
          const value2 = parseFloat(userProfile2.healthMetrics[metric])

          if (!isNaN(value1) && !isNaN(value2)) {
            // 计算相对差异
            const maxValue = Math.max(value1, value2)
            const difference = Math.abs(value1 - value2)
            const similarity = Math.max(0, 1 - difference / maxValue)
            metricsScores.push(similarity)
          }
        }
      })
    }

    // 计算健康指标平均相似度
    const metricsSimilarity = metricsScores.length > 0
      ? metricsScores.reduce((sum, score) => sum + score, 0) / metricsScores.length
      : 0

    // 偏好相似度
    let preferenceSimilarity = 0
    if (userProfile1.preferences && userProfile2.preferences) {
      // 比较各项偏好
      const preferenceTypes = ['foods', 'herbs', 'methods']
      const preferenceScores = []

      preferenceTypes.forEach(type => {
        if (userProfile1.preferences[type] && userProfile2.preferences[type]) {
          const similarity = this._calculateArrayOverlap(
            userProfile1.preferences[type],
            userProfile2.preferences[type]
          )
          preferenceScores.push(similarity)
        }
      })

      // 计算偏好平均相似度
      preferenceSimilarity = preferenceScores.length > 0
        ? preferenceScores.reduce((sum, score) => sum + score, 0) / preferenceScores.length
        : 0
    }

    // 计算总相似度
    const weights = {
      constitution: 0.4,
      symptom: 0.3,
      metrics: 0.2,
      preference: 0.1
    }

    return (
      constitutionSimilarity * weights.constitution +
      symptomSimilarity * weights.symptom +
      metricsSimilarity * weights.metrics +
      preferenceSimilarity * weights.preference
    )
  }

  /**
   * 使用自适应学习调整推荐得分
   * @param {string} userId - 用户ID
   * @param {Array} recommendations - 推荐项列表
   * @returns {Promise<Array>} 调整后的推荐列表
   */
  async adaptiveAdjustRecommendations (userId, recommendations) {
    if (!userId || !recommendations || recommendations.length === 0) {
      return recommendations
    }

    try {
      // 获取用户偏好分析
      const preferenceAnalysis = await this.userHealthProfileService.analyzeUserPreferences(userId)

      // 如果没有足够的用户反馈数据，直接返回原列表
      if (!preferenceAnalysis || !preferenceAnalysis.preferencesFound) {
        return recommendations
      }

      // 提取用户喜好和不喜好的特征
      const likedFeatures = new Map()
      const dislikedFeatures = new Map()

      // 处理喜好特征
      if (preferenceAnalysis.topFeatures) {
        preferenceAnalysis.topFeatures.forEach(feature => {
          const [type, value] = feature.feature.split(':')
          if (!likedFeatures.has(type)) {
            likedFeatures.set(type, [])
          }
          likedFeatures.get(type).push({ value, score: feature.score })
        })
      }

      // 处理不喜好特征
      if (preferenceAnalysis.bottomFeatures) {
        preferenceAnalysis.bottomFeatures.forEach(feature => {
          if (feature.score < 0) { // 只考虑负分特征
            const [type, value] = feature.feature.split(':')
            if (!dislikedFeatures.has(type)) {
              dislikedFeatures.set(type, [])
            }
            dislikedFeatures.get(type).push({ value, score: feature.score })
          }
        })
      }

      // 调整推荐分数
      const adjustedRecommendations = recommendations.map(recommendation => {
        // 基础分数
        let score = recommendation.score || 0
        const adjustments = {}

        // 提取推荐特征
        const features = this._extractRecommendationFeatures(recommendation)

        // 调整体质匹配
        if (features.constitutions.length > 0) {
          const likedConstitution = likedFeatures.get('constitution') || []
          const dislikedConstitution = dislikedFeatures.get('constitution') || []

          // 计算体质匹配调整
          const constitutionAdjustment = this._calculateFeatureAdjustment(
            features.constitutions,
            likedConstitution,
            dislikedConstitution
          )

          score += constitutionAdjustment
          adjustments.constitution = constitutionAdjustment
        }

        // 调整药材匹配
        if (features.herbs.length > 0) {
          const likedHerbs = likedFeatures.get('herb') || []
          const dislikedHerbs = dislikedFeatures.get('herb') || []

          // 计算药材匹配调整
          const herbAdjustment = this._calculateFeatureAdjustment(
            features.herbs,
            likedHerbs,
            dislikedHerbs
          )

          score += herbAdjustment
          adjustments.herb = herbAdjustment
        }

        // 调整食材匹配
        if (features.foods.length > 0) {
          const likedFoods = likedFeatures.get('ingredient') || []
          const dislikedFoods = dislikedFeatures.get('ingredient') || []

          // 计算食材匹配调整
          const foodAdjustment = this._calculateFeatureAdjustment(
            features.foods,
            likedFoods,
            dislikedFoods
          )

          score += foodAdjustment
          adjustments.food = foodAdjustment
        }

        // 调整方法匹配
        if (features.methods && features.methods.length > 0) {
          const likedMethods = likedFeatures.get('method') || []
          const dislikedMethods = dislikedFeatures.get('method') || []

          // 计算方法匹配调整
          const methodAdjustment = this._calculateFeatureAdjustment(
            features.methods,
            likedMethods,
            dislikedMethods
          )

          score += methodAdjustment
          adjustments.method = methodAdjustment
        }

        return {
          ...recommendation,
          score,
          adaptiveAdjustments: adjustments
        }
      })

      // 按分数排序
      return adjustedRecommendations.sort((a, b) => b.score - a.score)
    } catch (error) {
      logger.error('自适应调整推荐失败', { userId, error: error.message })
      return recommendations
    }
  }

  /**
   * 计算特征调整分数
   * @private
   * @param {Array} features - 特征列表
   * @param {Array} likedFeatures - 喜好特征
   * @param {Array} dislikedFeatures - 不喜好特征
   * @returns {number} 调整分数
   */
  _calculateFeatureAdjustment (features, likedFeatures, dislikedFeatures) {
    let adjustment = 0

    // 匹配喜好特征
    likedFeatures.forEach(feature => {
      if (features.includes(feature.value)) {
        adjustment += Math.min(feature.score, 10) // 限制最大调整
      }
    })

    // 匹配不喜好特征
    dislikedFeatures.forEach(feature => {
      if (features.includes(feature.value)) {
        adjustment += Math.max(feature.score, -10) // 限制最小调整
      }
    })

    return adjustment
  }

  /**
   * 更新自适应学习模型
   * @param {string} userId - 用户ID
   * @param {Object} feedback - 反馈数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateModel (userId, feedback) {
    if (!userId || !feedback) {
      return false
    }

    try {
      // 更新用户相似度缓存
      const userSimilarityPath = path.join(this.userSimilarityDir, `${userId}.json`)
      if (await fs.pathExists(userSimilarityPath)) {
        await fs.remove(userSimilarityPath)
      }

      // 更新模型数据
      const modelPath = path.join(this.modelDataDir, `${userId}.json`)
      let modelData = { userId, feedbackHistory: [] }

      if (await fs.pathExists(modelPath)) {
        modelData = await fs.readJson(modelPath)
      }

      // 添加反馈到历史
      modelData.feedbackHistory.push({
        ...feedback,
        timestamp: new Date().toISOString()
      })

      // 保存更新后的模型
      await fs.writeJson(modelPath, modelData, { spaces: 2 })

      return true
    } catch (error) {
      logger.error('更新自适应学习模型失败', { userId, error: error.message })
      return false
    }
  }
}

module.exports = AdaptiveLearningService
