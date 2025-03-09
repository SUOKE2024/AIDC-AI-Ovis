/**
 * 用户反馈服务
 * 负责收集、存储和处理用户对声诊分析结果的反馈
 */
const path = require('path')
const fs = require('fs').promises
const { ObjectId } = require('mongodb')

class UserFeedbackService {
  /**
   * 构造函数
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.voiceAdaptiveLearningService - 声诊自适应学习服务
   * @param {Object} dependencies.userProfileService - 用户档案服务
   * @param {Object} dependencies.logger - 日志服务
   */
  constructor (dependencies) {
    this.dbClient = dependencies.dbClient
    this.voiceAdaptiveLearningService = dependencies.voiceAdaptiveLearningService
    this.userProfileService = dependencies.userProfileService
    this.logger = dependencies.logger || console

    // 反馈相关集合名称
    this.collections = {
      feedback: 'voice_feedback',
      followup: 'voice_followup',
      expertFeedback: 'voice_expert_feedback',
      satisfactionSurvey: 'voice_satisfaction_survey'
    }

    // 有效的反馈类型
    this.validFeedbackTypes = [
      'accuracy', // 准确性反馈
      'correction', // 修正建议
      'symptom', // 症状相关性
      'treatment', // 治疗建议有效性
      'classical_reference', // 经典参考正确性
      'general' // 一般反馈
    ]
  }

  /**
   * 初始化服务
   * @returns {Promise<void>}
   */
  async initialize () {
    try {
      // 确保所需的集合存在
      await this.ensureCollections()

      // 创建必要的索引
      await this.createIndexes()

      this.logger.info('用户反馈服务初始化完成')
    } catch (error) {
      this.logger.error('用户反馈服务初始化失败', error)
      throw error
    }
  }

  /**
   * 确保所需的集合存在
   * @returns {Promise<void>}
   */
  async ensureCollections () {
    try {
      const db = this.dbClient.db()
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map(c => c.name)

      for (const [key, name] of Object.entries(this.collections)) {
        if (!collectionNames.includes(name)) {
          await db.createCollection(name)
          this.logger.info(`创建集合: ${name}`)
        }
      }
    } catch (error) {
      this.logger.error('确保集合存在失败', error)
      throw error
    }
  }

  /**
   * 创建必要的索引
   * @returns {Promise<void>}
   */
  async createIndexes () {
    try {
      // 为反馈集合创建索引
      await this.dbClient.collection(this.collections.feedback).createIndexes([
        { key: { userId: 1 }, name: 'userId_index' },
        { key: { diagnosisId: 1 }, name: 'diagnosisId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      // 为随访集合创建索引
      await this.dbClient.collection(this.collections.followup).createIndexes([
        { key: { userId: 1 }, name: 'userId_index' },
        { key: { originalDiagnosisId: 1 }, name: 'originalDiagnosisId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      // 为专家反馈集合创建索引
      await this.dbClient.collection(this.collections.expertFeedback).createIndexes([
        { key: { expertId: 1 }, name: 'expertId_index' },
        { key: { diagnosisId: 1 }, name: 'diagnosisId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      // 为满意度调查集合创建索引
      await this.dbClient.collection(this.collections.satisfactionSurvey).createIndexes([
        { key: { userId: 1 }, name: 'userId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      this.logger.info('创建索引完成')
    } catch (error) {
      this.logger.error('创建索引失败', error)
      throw error
    }
  }

  /**
   * 提交用户反馈
   * @param {Object} feedback - 用户反馈数据
   * @param {string} feedback.userId - 用户ID
   * @param {string} feedback.diagnosisId - 诊断结果ID
   * @param {number} feedback.satisfactionRating - 满意度评分(1-5)
   * @param {boolean} feedback.isAccurate - 是否认为诊断准确
   * @param {string} feedback.feedbackType - 反馈类型
   * @param {string} feedback.comment - 反馈内容
   * @param {Array} feedback.suggestedCorrections - 建议的修正
   * @param {boolean} feedback.isExpertFeedback - 是否为专家反馈
   * @returns {Promise<Object>} - 处理结果
   */
  async submitFeedback (feedback) {
    try {
      // 验证必须的字段
      this.validateFeedbackData(feedback)

      // 创建反馈记录
      const feedbackRecord = {
        userId: feedback.userId,
        diagnosisId: feedback.diagnosisId,
        satisfactionRating: feedback.satisfactionRating,
        isAccurate: feedback.isAccurate,
        feedbackType: feedback.feedbackType || 'general',
        comment: feedback.comment,
        suggestedCorrections: feedback.suggestedCorrections || [],
        isExpertFeedback: feedback.isExpertFeedback || false,
        createdAt: new Date()
      }

      // 插入反馈记录
      const collection = this.dbClient.collection(this.collections.feedback)
      const result = await collection.insertOne(feedbackRecord)

      // 处理反馈数据，用于学习
      if (this.voiceAdaptiveLearningService) {
        await this.voiceAdaptiveLearningService.processFeedback({
          ...feedbackRecord,
          _id: result.insertedId.toString()
        })
      }

      // 更新用户反馈统计
      await this.updateUserFeedbackStats(feedback.userId)

      return {
        success: true,
        feedbackId: result.insertedId.toString(),
        message: '反馈提交成功'
      }
    } catch (error) {
      this.logger.error('提交反馈失败', error)
      throw error
    }
  }

  /**
   * 验证反馈数据
   * @param {Object} feedback - 反馈数据
   * @throws {Error} - 如果数据无效
   */
  validateFeedbackData (feedback) {
    if (!feedback.userId) {
      throw new Error('用户ID是必须的')
    }

    if (!feedback.diagnosisId) {
      throw new Error('诊断结果ID是必须的')
    }

    if (feedback.satisfactionRating !== undefined) {
      const rating = Number(feedback.satisfactionRating)
      if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error('满意度评分必须是1-5之间的数字')
      }
    }

    if (feedback.feedbackType && !this.validFeedbackTypes.includes(feedback.feedbackType)) {
      throw new Error(`无效的反馈类型: ${feedback.feedbackType}`)
    }

    if (feedback.suggestedCorrections && !Array.isArray(feedback.suggestedCorrections)) {
      throw new Error('suggestedCorrections必须是数组')
    }
  }

  /**
   * 更新用户反馈统计
   * @param {string} userId - 用户ID
   * @returns {Promise<void>}
   */
  async updateUserFeedbackStats (userId) {
    try {
      if (!this.userProfileService) return

      // 获取用户所有反馈
      const collection = this.dbClient.collection(this.collections.feedback)
      const feedbacks = await collection.find({ userId }).toArray()

      // 计算统计数据
      const stats = {
        totalFeedbacks: feedbacks.length,
        averageSatisfaction: 0,
        accuracyRate: 0,
        lastFeedbackDate: feedbacks.length > 0
          ? new Date(Math.max(...feedbacks.map(f => f.createdAt.getTime())))
          : null
      }

      // 计算平均满意度
      const satisfactionRatings = feedbacks
        .filter(f => f.satisfactionRating !== undefined)
        .map(f => f.satisfactionRating)

      if (satisfactionRatings.length > 0) {
        stats.averageSatisfaction = satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      }

      // 计算准确率
      const accuracyFeedbacks = feedbacks.filter(f => f.isAccurate !== undefined)
      if (accuracyFeedbacks.length > 0) {
        const accurateCount = accuracyFeedbacks.filter(f => f.isAccurate).length
        stats.accuracyRate = accurateCount / accuracyFeedbacks.length
      }

      // 更新用户档案
      await this.userProfileService.updateUserProfile(userId, {
        voiceFeedbackStats: stats
      })
    } catch (error) {
      this.logger.error(`更新用户反馈统计失败: ${userId}`, error)
      // 不抛出异常，以免中断主流程
    }
  }

  /**
   * 提交专家反馈
   * @param {Object} feedback - 专家反馈数据
   * @param {string} feedback.expertId - 专家ID
   * @param {string} feedback.diagnosisId - 诊断结果ID
   * @param {boolean} feedback.isAccurate - 诊断是否准确
   * @param {Array} feedback.corrections - 修正内容
   * @param {string} feedback.clinicalOpinion - 临床意见
   * @param {number} feedback.clinicalRelevance - 临床相关性评分(1-5)
   * @returns {Promise<Object>} - 处理结果
   */
  async submitExpertFeedback (feedback) {
    try {
      // 验证专家身份
      const isExpert = await this.validateExpertIdentity(feedback.expertId)
      if (!isExpert) {
        throw new Error('您不是经过验证的专家用户')
      }

      // 创建专家反馈记录
      const expertFeedbackRecord = {
        expertId: feedback.expertId,
        diagnosisId: feedback.diagnosisId,
        isAccurate: feedback.isAccurate,
        corrections: feedback.corrections || [],
        clinicalOpinion: feedback.clinicalOpinion,
        clinicalRelevance: feedback.clinicalRelevance,
        createdAt: new Date()
      }

      // 插入专家反馈记录
      const collection = this.dbClient.collection(this.collections.expertFeedback)
      const result = await collection.insertOne(expertFeedbackRecord)

      // 转换为普通反馈格式，用于学习
      if (this.voiceAdaptiveLearningService) {
        const learningFeedback = {
          userId: feedback.expertId,
          diagnosisId: feedback.diagnosisId,
          isAccurate: feedback.isAccurate,
          comment: feedback.clinicalOpinion,
          suggestedCorrections: this.mapCorrectionsToSuggestions(feedback.corrections),
          isExpertFeedback: true,
          _id: result.insertedId.toString()
        }

        await this.voiceAdaptiveLearningService.processFeedback(learningFeedback)
      }

      return {
        success: true,
        feedbackId: result.insertedId.toString(),
        message: '专家反馈提交成功'
      }
    } catch (error) {
      this.logger.error('提交专家反馈失败', error)
      throw error
    }
  }

  /**
   * 验证专家身份
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} - 是否为专家
   */
  async validateExpertIdentity (userId) {
    try {
      if (!this.userProfileService) return false

      const userProfile = await this.userProfileService.getUserProfile(userId)

      return userProfile && userProfile.isExpert
    } catch (error) {
      this.logger.error(`验证专家身份失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 将专家修正映射为建议修正格式
   * @param {Array} corrections - 专家修正
   * @returns {Array} - 建议修正
   */
  mapCorrectionsToSuggestions (corrections) {
    if (!corrections || !Array.isArray(corrections)) return []

    return corrections.map(correction => ({
      type: correction.field,
      value: correction.correctValue,
      confidence: correction.confidenceLevel || 1.0,
      note: correction.note
    }))
  }

  /**
   * 提交治疗效果随访
   * @param {Object} followup - 随访数据
   * @param {string} followup.userId - 用户ID
   * @param {string} followup.originalDiagnosisId - 原始诊断ID
   * @param {number} followup.effectivenessRating - 效果评分(1-5)
   * @param {string} followup.status - 状态(improved/unchanged/worsened)
   * @param {Array} followup.remainingSymptoms - 剩余症状
   * @param {Array} followup.resolvedSymptoms - 已解决症状
   * @param {string} followup.feedback - 反馈内容
   * @returns {Promise<Object>} - 处理结果
   */
  async submitTreatmentFollowup (followup) {
    try {
      // 创建随访记录
      const followupRecord = {
        userId: followup.userId,
        originalDiagnosisId: followup.originalDiagnosisId,
        effectivenessRating: followup.effectivenessRating,
        status: followup.status,
        remainingSymptoms: followup.remainingSymptoms || [],
        resolvedSymptoms: followup.resolvedSymptoms || [],
        feedback: followup.feedback,
        createdAt: new Date()
      }

      // 插入随访记录
      const collection = this.dbClient.collection(this.collections.followup)
      const result = await collection.insertOne(followupRecord)

      // 根据随访结果更新模型（如果效果不佳）
      if ((followup.effectivenessRating && followup.effectivenessRating < 3) ||
          followup.status === 'worsened') {
        await this.handleNegativeTreatmentOutcome(followup)
      }

      return {
        success: true,
        followupId: result.insertedId.toString(),
        message: '治疗效果随访提交成功'
      }
    } catch (error) {
      this.logger.error('提交治疗效果随访失败', error)
      throw error
    }
  }

  /**
   * 处理负面治疗结果
   * @param {Object} followup - 随访数据
   * @returns {Promise<void>}
   */
  async handleNegativeTreatmentOutcome (followup) {
    try {
      if (!this.voiceAdaptiveLearningService) return

      // 获取原始诊断
      const diagnosisCollection = this.dbClient.collection('voice_diagnosis_results')
      const diagnosis = await diagnosisCollection.findOne({
        _id: new ObjectId(followup.originalDiagnosisId)
      })

      if (!diagnosis) return

      // 创建修正反馈
      const correctionFeedback = {
        userId: followup.userId,
        diagnosisId: followup.originalDiagnosisId,
        isAccurate: false, // 标记为不准确，因为治疗效果不佳
        comment: `基于治疗效果反馈：${followup.feedback}`,
        suggestedCorrections: [],
        isExpertFeedback: false
      }

      // 处理反馈
      await this.voiceAdaptiveLearningService.processFeedback(correctionFeedback)
    } catch (error) {
      this.logger.error('处理负面治疗结果失败', error)
      // 不抛出异常，以免中断主流程
    }
  }

  /**
   * 提交满意度调查
   * @param {Object} survey - 调查数据
   * @param {string} survey.userId - 用户ID
   * @param {number} survey.overallSatisfaction - 整体满意度(1-5)
   * @param {number} survey.usability - 易用性评分(1-5)
   * @param {number} survey.relevance - 相关性评分(1-5)
   * @param {number} survey.accuracy - 准确性评分(1-5)
   * @param {number} survey.recommendation - 推荐评分(1-5)
   * @param {string} survey.feedback - 反馈内容
   * @param {Array} survey.suggestedImprovements - 建议改进
   * @returns {Promise<Object>} - 处理结果
   */
  async submitSatisfactionSurvey (survey) {
    try {
      // 创建调查记录
      const surveyRecord = {
        userId: survey.userId,
        overallSatisfaction: survey.overallSatisfaction,
        usability: survey.usability,
        relevance: survey.relevance,
        accuracy: survey.accuracy,
        recommendation: survey.recommendation,
        feedback: survey.feedback,
        suggestedImprovements: survey.suggestedImprovements || [],
        createdAt: new Date()
      }

      // 插入调查记录
      const collection = this.dbClient.collection(this.collections.satisfactionSurvey)
      const result = await collection.insertOne(surveyRecord)

      // 更新用户满意度统计
      if (this.userProfileService) {
        await this.userProfileService.updateUserProfile(survey.userId, {
          lastSurveyDate: new Date(),
          satisfactionLevel: survey.overallSatisfaction
        })
      }

      return {
        success: true,
        surveyId: result.insertedId.toString(),
        message: '满意度调查提交成功'
      }
    } catch (error) {
      this.logger.error('提交满意度调查失败', error)
      throw error
    }
  }

  /**
   * 获取用户反馈历史
   * @param {Object} options - 查询选项
   * @param {string} options.userId - 用户ID
   * @param {number} options.limit - 限制条数
   * @param {number} options.offset - 偏移量
   * @param {string} options.sortBy - 排序字段
   * @param {string} options.sortOrder - 排序顺序(asc/desc)
   * @returns {Promise<Object>} - 用户反馈历史
   */
  async getUserFeedbackHistory (options) {
    try {
      const {
        userId,
        limit = 10,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      // 验证用户ID
      if (!userId) {
        throw new Error('用户ID是必须的')
      }

      // 获取用户反馈
      const collection = this.dbClient.collection(this.collections.feedback)

      const sort = {}
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1

      const feedbacks = await collection.find({ userId })
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray()

      const total = await collection.countDocuments({ userId })

      // 获取诊断结果摘要
      const feedbacksWithDiagnosis = await this.attachDiagnosisSummary(feedbacks)

      return {
        total,
        data: feedbacksWithDiagnosis,
        limit,
        offset
      }
    } catch (error) {
      this.logger.error('获取用户反馈历史失败', error)
      throw error
    }
  }

  /**
   * 附加诊断结果摘要
   * @param {Array} feedbacks - 反馈记录
   * @returns {Promise<Array>} - 带诊断摘要的反馈记录
   */
  async attachDiagnosisSummary (feedbacks) {
    try {
      if (!feedbacks || feedbacks.length === 0) return []

      const diagnosisIds = feedbacks.map(f => new ObjectId(f.diagnosisId)).filter(Boolean)

      // 获取诊断结果
      const diagnosisCollection = this.dbClient.collection('voice_diagnosis_results')
      const diagnosisList = await diagnosisCollection.find({
        _id: { $in: diagnosisIds }
      }).toArray()

      // 创建ID到摘要的映射
      const diagnosisMap = {}
      for (const diagnosis of diagnosisList) {
        diagnosisMap[diagnosis._id.toString()] = {
          dominantTone: diagnosis.dominantTone,
          associatedOrgan: diagnosis.associatedOrgan,
          primaryDisharmony: diagnosis.potentialDisharmonies && diagnosis.potentialDisharmonies.length > 0
            ? diagnosis.potentialDisharmonies[0].name
            : null,
          analysisTime: diagnosis.analysisTime
        }
      }

      // 将摘要附加到反馈记录
      return feedbacks.map(feedback => ({
        ...feedback,
        diagnosisSummary: diagnosisMap[feedback.diagnosisId] || null
      }))
    } catch (error) {
      this.logger.error('附加诊断结果摘要失败', error)
      // 返回原始反馈，不附加摘要
      return feedbacks
    }
  }

  /**
   * 获取用户随访历史
   * @param {Object} options - 查询选项
   * @param {string} options.userId - 用户ID
   * @param {number} options.limit - 限制条数
   * @param {number} options.offset - 偏移量
   * @returns {Promise<Object>} - 用户随访历史
   */
  async getUserFollowupHistory (options) {
    try {
      const { userId, limit = 10, offset = 0 } = options

      // 验证用户ID
      if (!userId) {
        throw new Error('用户ID是必须的')
      }

      // 获取用户随访
      const collection = this.dbClient.collection(this.collections.followup)

      const followups = await collection.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray()

      const total = await collection.countDocuments({ userId })

      // 获取诊断结果摘要
      const followupsWithDiagnosis = await this.attachFollowupDiagnosisSummary(followups)

      return {
        total,
        data: followupsWithDiagnosis,
        limit,
        offset
      }
    } catch (error) {
      this.logger.error('获取用户随访历史失败', error)
      throw error
    }
  }

  /**
   * 附加随访相关的诊断结果摘要
   * @param {Array} followups - 随访记录
   * @returns {Promise<Array>} - 带诊断摘要的随访记录
   */
  async attachFollowupDiagnosisSummary (followups) {
    try {
      if (!followups || followups.length === 0) return []

      const diagnosisIds = followups.map(f => new ObjectId(f.originalDiagnosisId)).filter(Boolean)

      // 获取诊断结果
      const diagnosisCollection = this.dbClient.collection('voice_diagnosis_results')
      const diagnosisList = await diagnosisCollection.find({
        _id: { $in: diagnosisIds }
      }).toArray()

      // 创建ID到摘要的映射
      const diagnosisMap = {}
      for (const diagnosis of diagnosisList) {
        diagnosisMap[diagnosis._id.toString()] = {
          dominantTone: diagnosis.dominantTone,
          associatedOrgan: diagnosis.associatedOrgan,
          primaryDisharmony: diagnosis.potentialDisharmonies && diagnosis.potentialDisharmonies.length > 0
            ? diagnosis.potentialDisharmonies[0].name
            : null,
          recommendations: diagnosis.recommendations,
          analysisTime: diagnosis.analysisTime
        }
      }

      // 将摘要附加到随访记录
      return followups.map(followup => ({
        ...followup,
        diagnosisSummary: diagnosisMap[followup.originalDiagnosisId] || null
      }))
    } catch (error) {
      this.logger.error('附加随访诊断结果摘要失败', error)
      // 返回原始随访，不附加摘要
      return followups
    }
  }

  /**
   * 获取反馈统计
   * @returns {Promise<Object>} - 反馈统计
   */
  async getFeedbackStats () {
    try {
      const feedbackCollection = this.dbClient.collection(this.collections.feedback)
      const expertFeedbackCollection = this.dbClient.collection(this.collections.expertFeedback)
      const followupCollection = this.dbClient.collection(this.collections.followup)

      // 总反馈数
      const totalFeedbacks = await feedbackCollection.countDocuments()

      // 总专家反馈数
      const totalExpertFeedbacks = await expertFeedbackCollection.countDocuments()

      // 总随访数
      const totalFollowups = await followupCollection.countDocuments()

      // 计算平均满意度
      const satisfactionPipeline = [
        { $match: { satisfactionRating: { $exists: true, $ne: null } } },
        { $group: { _id: null, average: { $avg: '$satisfactionRating' } } }
      ]

      const satisfactionResult = await feedbackCollection.aggregate(satisfactionPipeline).toArray()
      const averageSatisfaction = satisfactionResult.length > 0 ? satisfactionResult[0].average : null

      // 计算准确率
      const accuracyPipeline = [
        { $match: { isAccurate: { $exists: true } } },
        { $group: { _id: '$isAccurate', count: { $sum: 1 } } }
      ]

      const accuracyResult = await feedbackCollection.aggregate(accuracyPipeline).toArray()

      let accurateCount = 0
      let inaccurateCount = 0

      for (const result of accuracyResult) {
        if (result._id === true) {
          accurateCount = result.count
        } else if (result._id === false) {
          inaccurateCount = result.count
        }
      }

      const totalAccuracyFeedbacks = accurateCount + inaccurateCount
      const accuracyRate = totalAccuracyFeedbacks > 0 ? accurateCount / totalAccuracyFeedbacks : null

      // 计算随访效果
      const followupEffectivenessPipeline = [
        { $match: { effectivenessRating: { $exists: true, $ne: null } } },
        { $group: { _id: null, average: { $avg: '$effectivenessRating' } } }
      ]

      const followupResult = await followupCollection.aggregate(followupEffectivenessPipeline).toArray()
      const averageEffectiveness = followupResult.length > 0 ? followupResult[0].average : null

      // 最近的反馈
      const recentFeedback = await feedbackCollection.find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      const latestFeedbackDate = recentFeedback.length > 0 ? recentFeedback[0].createdAt : null

      return {
        totalFeedbacks,
        totalExpertFeedbacks,
        totalFollowups,
        averageSatisfaction,
        accuracyRate,
        accurateCount,
        inaccurateCount,
        averageEffectiveness,
        latestFeedbackDate
      }
    } catch (error) {
      this.logger.error('获取反馈统计失败', error)
      throw error
    }
  }
}

module.exports = UserFeedbackService
