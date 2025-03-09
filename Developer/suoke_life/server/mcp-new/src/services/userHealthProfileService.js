/**
 * @fileoverview 用户健康画像服务，管理用户健康数据、体质分析和偏好记录
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')

/**
 * 用户健康画像服务类
 */
class UserHealthProfileService {
  /**
   * 创建用户健康画像服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {Object} options.tcmKnowledgeService - 中医知识库服务实例
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'user_profiles')
    this.profilesDir = path.join(this.dataDir, 'health_profiles')
    this.feedbackDir = path.join(this.dataDir, 'feedback')
    this.preferencesDir = path.join(this.dataDir, 'preferences')

    this.tcmKnowledgeService = options.tcmKnowledgeService

    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  async _initService () {
    try {
      // 确保目录存在
      await fs.ensureDir(this.profilesDir)
      await fs.ensureDir(this.feedbackDir)
      await fs.ensureDir(this.preferencesDir)

      logger.info('用户健康画像服务初始化完成')
    } catch (error) {
      logger.error('用户健康画像服务初始化失败', error)
    }
  }

  /**
   * 获取用户健康画像
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户健康画像
   */
  async getUserHealthProfile (userId) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      const profilePath = path.join(this.profilesDir, `${userId}.json`)

      if (await fs.pathExists(profilePath)) {
        return await fs.readJson(profilePath)
      }

      // 如果用户画像不存在，返回空对象
      return {
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        constitution: {},
        symptoms: [],
        healthMetrics: {},
        preferences: {},
        feedbackHistory: []
      }
    } catch (error) {
      logger.error('获取用户健康画像失败', { userId, error: error.message })
      throw new Error(`获取用户健康画像失败: ${error.message}`)
    }
  }

  /**
   * 更新用户健康画像
   * @param {string} userId - 用户ID
   * @param {Object} profileData - 健康画像数据
   * @returns {Promise<Object>} 更新后的用户健康画像
   */
  async updateUserHealthProfile (userId, profileData) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      // 获取现有画像数据
      let existingProfile = {}
      const profilePath = path.join(this.profilesDir, `${userId}.json`)

      if (await fs.pathExists(profilePath)) {
        existingProfile = await fs.readJson(profilePath)
      }

      // 合并新数据
      const updatedProfile = {
        ...existingProfile,
        ...profileData,
        userId,
        updatedAt: new Date().toISOString()
      }

      // 如果是新建画像，添加创建时间
      if (!existingProfile.createdAt) {
        updatedProfile.createdAt = new Date().toISOString()
      }

      // 保存更新后的画像
      await fs.writeJson(profilePath, updatedProfile, { spaces: 2 })

      return updatedProfile
    } catch (error) {
      logger.error('更新用户健康画像失败', { userId, error: error.message })
      throw new Error(`更新用户健康画像失败: ${error.message}`)
    }
  }

  /**
   * 更新用户体质信息
   * @param {string} userId - 用户ID
   * @param {Object} constitutionData - 体质数据
   * @returns {Promise<Object>} 更新后的用户健康画像
   */
  async updateConstitution (userId, constitutionData) {
    if (!userId || !constitutionData) {
      throw new Error('用户ID和体质数据不能为空')
    }

    try {
      // 获取现有画像
      const profile = await this.getUserHealthProfile(userId)

      // 更新体质数据
      profile.constitution = {
        ...profile.constitution,
        ...constitutionData,
        updatedAt: new Date().toISOString()
      }

      // 保存更新后的画像
      return await this.updateUserHealthProfile(userId, profile)
    } catch (error) {
      logger.error('更新用户体质信息失败', { userId, error: error.message })
      throw new Error(`更新用户体质信息失败: ${error.message}`)
    }
  }

  /**
   * 更新用户健康指标
   * @param {string} userId - 用户ID
   * @param {Object} metrics - 健康指标数据
   * @returns {Promise<Object>} 更新后的用户健康画像
   */
  async updateHealthMetrics (userId, metrics) {
    if (!userId || !metrics) {
      throw new Error('用户ID和健康指标不能为空')
    }

    try {
      // 获取现有画像
      const profile = await this.getUserHealthProfile(userId)

      // 确保健康指标历史记录存在
      if (!profile.healthMetricsHistory) {
        profile.healthMetricsHistory = []
      }

      // 添加当前指标到历史记录
      if (profile.healthMetrics) {
        profile.healthMetricsHistory.push({
          ...profile.healthMetrics,
          recordedAt: profile.healthMetrics.updatedAt || new Date().toISOString()
        })

        // 限制历史记录数量
        if (profile.healthMetricsHistory.length > 50) {
          profile.healthMetricsHistory = profile.healthMetricsHistory.slice(-50)
        }
      }

      // 更新当前健康指标
      profile.healthMetrics = {
        ...metrics,
        updatedAt: new Date().toISOString()
      }

      // 保存更新后的画像
      return await this.updateUserHealthProfile(userId, profile)
    } catch (error) {
      logger.error('更新用户健康指标失败', { userId, error: error.message })
      throw new Error(`更新用户健康指标失败: ${error.message}`)
    }
  }

  /**
   * 更新用户症状信息
   * @param {string} userId - 用户ID
   * @param {Array} symptoms - 症状列表
   * @returns {Promise<Object>} 更新后的用户健康画像
   */
  async updateSymptoms (userId, symptoms) {
    if (!userId || !Array.isArray(symptoms)) {
      throw new Error('用户ID和症状列表不能为空')
    }

    try {
      // 获取现有画像
      const profile = await this.getUserHealthProfile(userId)

      // 更新症状数据
      profile.symptoms = symptoms
      profile.symptomsUpdatedAt = new Date().toISOString()

      // 保存更新后的画像
      return await this.updateUserHealthProfile(userId, profile)
    } catch (error) {
      logger.error('更新用户症状信息失败', { userId, error: error.message })
      throw new Error(`更新用户症状信息失败: ${error.message}`)
    }
  }

  /**
   * 更新用户偏好
   * @param {string} userId - 用户ID
   * @param {Object} preferences - 用户偏好
   * @returns {Promise<Object>} 更新后的用户健康画像
   */
  async updatePreferences (userId, preferences) {
    if (!userId || !preferences) {
      throw new Error('用户ID和偏好数据不能为空')
    }

    try {
      // 获取现有画像
      const profile = await this.getUserHealthProfile(userId)

      // 更新偏好数据
      profile.preferences = {
        ...profile.preferences,
        ...preferences,
        updatedAt: new Date().toISOString()
      }

      // 保存更新后的画像
      return await this.updateUserHealthProfile(userId, profile)
    } catch (error) {
      logger.error('更新用户偏好失败', { userId, error: error.message })
      throw new Error(`更新用户偏好失败: ${error.message}`)
    }
  }

  /**
   * 记录用户对推荐结果的反馈
   * @param {string} userId - 用户ID
   * @param {string} recommendationId - 推荐ID
   * @param {string} feedbackType - 反馈类型（like/dislike/neutral）
   * @param {Object} details - 反馈详情
   * @returns {Promise<Object>} 反馈记录
   */
  async recordFeedback (userId, recommendationId, feedbackType, details = {}) {
    if (!userId || !recommendationId || !feedbackType) {
      throw new Error('用户ID、推荐ID和反馈类型不能为空')
    }

    try {
      // 创建反馈记录
      const feedback = {
        id: uuidv4(),
        userId,
        recommendationId,
        feedbackType,
        details,
        createdAt: new Date().toISOString()
      }

      // 保存反馈记录
      const feedbackPath = path.join(this.feedbackDir, `${feedback.id}.json`)
      await fs.writeJson(feedbackPath, feedback, { spaces: 2 })

      // 更新用户画像中的反馈历史
      const profile = await this.getUserHealthProfile(userId)

      if (!profile.feedbackHistory) {
        profile.feedbackHistory = []
      }

      profile.feedbackHistory.push({
        feedbackId: feedback.id,
        recommendationId,
        feedbackType,
        createdAt: feedback.createdAt
      })

      // 限制历史记录数量
      if (profile.feedbackHistory.length > 50) {
        profile.feedbackHistory = profile.feedbackHistory.slice(-50)
      }

      // 保存更新后的画像
      await this.updateUserHealthProfile(userId, profile)

      return feedback
    } catch (error) {
      logger.error('记录用户反馈失败', { userId, recommendationId, error: error.message })
      throw new Error(`记录用户反馈失败: ${error.message}`)
    }
  }

  /**
   * 获取用户反馈历史
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制条数
   * @param {string} options.feedbackType - 反馈类型过滤
   * @returns {Promise<Array>} 反馈历史
   */
  async getUserFeedback (userId, options = {}) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    const { limit = 20, feedbackType } = options

    try {
      // 获取用户画像
      const profile = await this.getUserHealthProfile(userId)

      if (!profile.feedbackHistory || profile.feedbackHistory.length === 0) {
        return []
      }

      // 根据条件过滤反馈历史
      let feedbackHistory = [...profile.feedbackHistory]

      if (feedbackType) {
        feedbackHistory = feedbackHistory.filter(item => item.feedbackType === feedbackType)
      }

      // 按时间倒序排序并限制条数
      feedbackHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      feedbackHistory = feedbackHistory.slice(0, limit)

      // 加载详细反馈记录
      const detailedFeedback = []

      for (const item of feedbackHistory) {
        const feedbackPath = path.join(this.feedbackDir, `${item.feedbackId}.json`)

        if (await fs.pathExists(feedbackPath)) {
          const feedback = await fs.readJson(feedbackPath)
          detailedFeedback.push(feedback)
        }
      }

      return detailedFeedback
    } catch (error) {
      logger.error('获取用户反馈历史失败', { userId, error: error.message })
      throw new Error(`获取用户反馈历史失败: ${error.message}`)
    }
  }

  /**
   * 分析用户偏好模式
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 偏好分析结果
   */
  async analyzeUserPreferences (userId) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      // 获取用户反馈历史
      const feedback = await this.getUserFeedback(userId, { limit: 50 })

      if (feedback.length === 0) {
        return {
          userId,
          preferencesFound: false,
          message: '用户反馈数据不足，无法分析偏好'
        }
      }

      // 分析喜好的推荐类型
      const likedRecommendations = feedback.filter(item => item.feedbackType === 'like')
      const dislikedRecommendations = feedback.filter(item => item.feedbackType === 'dislike')

      // 提取喜好的特征
      const likedFeatures = this._extractFeatures(likedRecommendations)
      const dislikedFeatures = this._extractFeatures(dislikedRecommendations)

      // 计算特征得分
      const featureScores = this._calculateFeatureScores(likedFeatures, dislikedFeatures)

      // 提取用户最有可能喜欢的特征
      const topFeatures = Object.entries(featureScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([feature, score]) => ({ feature, score }))

      // 提取用户最有可能不喜欢的特征
      const bottomFeatures = Object.entries(featureScores)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10)
        .map(([feature, score]) => ({ feature, score }))

      return {
        userId,
        preferencesFound: true,
        feedbackCount: feedback.length,
        likeCount: likedRecommendations.length,
        dislikeCount: dislikedRecommendations.length,
        topFeatures,
        bottomFeatures
      }
    } catch (error) {
      logger.error('分析用户偏好失败', { userId, error: error.message })
      throw new Error(`分析用户偏好失败: ${error.message}`)
    }
  }

  /**
   * 从反馈中提取特征
   * @private
   * @param {Array} recommendations - 推荐记录
   * @returns {Object} 特征统计
   */
  _extractFeatures (recommendations) {
    const features = {}

    recommendations.forEach(recommendation => {
      if (recommendation.details) {
        // 处理药材特征
        if (recommendation.details.herbs && Array.isArray(recommendation.details.herbs)) {
          recommendation.details.herbs.forEach(herb => {
            const feature = `herb:${herb}`
            features[feature] = (features[feature] || 0) + 1
          })
        }

        // 处理食材特征
        if (recommendation.details.ingredients && Array.isArray(recommendation.details.ingredients)) {
          recommendation.details.ingredients.forEach(ingredient => {
            const feature = `ingredient:${ingredient}`
            features[feature] = (features[feature] || 0) + 1
          })
        }

        // 处理调理方法特征
        if (recommendation.details.methods && Array.isArray(recommendation.details.methods)) {
          recommendation.details.methods.forEach(method => {
            const feature = `method:${method}`
            features[feature] = (features[feature] || 0) + 1
          })
        }

        // 处理体质特征
        if (recommendation.details.constitution) {
          const feature = `constitution:${recommendation.details.constitution}`
          features[feature] = (features[feature] || 0) + 1
        }

        // 处理症状特征
        if (recommendation.details.symptoms && Array.isArray(recommendation.details.symptoms)) {
          recommendation.details.symptoms.forEach(symptom => {
            const feature = `symptom:${symptom}`
            features[feature] = (features[feature] || 0) + 1
          })
        }
      }
    })

    return features
  }

  /**
   * 计算特征得分
   * @private
   * @param {Object} likedFeatures - 喜欢的特征统计
   * @param {Object} dislikedFeatures - 不喜欢的特征统计
   * @returns {Object} 特征得分
   */
  _calculateFeatureScores (likedFeatures, dislikedFeatures) {
    const featureScores = {}

    // 处理喜欢的特征
    Object.entries(likedFeatures).forEach(([feature, count]) => {
      featureScores[feature] = count
    })

    // 处理不喜欢的特征
    Object.entries(dislikedFeatures).forEach(([feature, count]) => {
      featureScores[feature] = (featureScores[feature] || 0) - count
    })

    return featureScores
  }

  /**
   * 基于用户健康画像和偏好生成个性化权重
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 个性化权重
   */
  async generatePersonalizedWeights (userId) {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      // 获取用户健康画像
      const profile = await this.getUserHealthProfile(userId)

      // 获取用户偏好分析
      const preferenceAnalysis = await this.analyzeUserPreferences(userId)

      // 基础权重
      const weights = {
        constitutionMatch: 0.35, // 体质匹配权重
        seasonMatch: 0.20, // 季节匹配权重
        symptomMatch: 0.25, // 症状匹配权重
        userPreference: 0.15, // 用户偏好权重
        ageMatch: 0.05 // 年龄匹配权重
      }

      // 根据用户画像调整权重
      if (profile) {
        // 如果用户有明确的症状，提高症状匹配权重
        if (profile.symptoms && profile.symptoms.length > 0) {
          weights.symptomMatch += 0.05
          weights.constitutionMatch -= 0.05
        }

        // 如果用户有偏好设置，提高用户偏好权重
        if (profile.preferences && Object.keys(profile.preferences).length > 0) {
          weights.userPreference += 0.05
          weights.ageMatch -= 0.05
        }
      }

      // 根据偏好分析调整权重
      if (preferenceAnalysis && preferenceAnalysis.preferencesFound) {
        // 如果用户有足够的反馈，进一步调整权重
        if (preferenceAnalysis.feedbackCount > 10) {
          weights.userPreference += 0.05
          weights.constitutionMatch -= 0.05
        }
      }

      // 归一化权重
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)

      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / total
      })

      return weights
    } catch (error) {
      logger.error('生成个性化权重失败', { userId, error: error.message })
      // 返回默认权重
      return {
        constitutionMatch: 0.35,
        seasonMatch: 0.20,
        symptomMatch: 0.25,
        userPreference: 0.15,
        ageMatch: 0.05
      }
    }
  }
}

module.exports = UserHealthProfileService
