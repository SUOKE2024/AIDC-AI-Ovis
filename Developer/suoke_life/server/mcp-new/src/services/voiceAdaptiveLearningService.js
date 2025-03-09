/**
 * 声诊专用自适应学习服务
 * 基于用户反馈动态调整声诊分析模型的能力
 */
const path = require('path')
const fs = require('fs').promises

class VoiceAdaptiveLearningService {
  /**
   * 构造函数
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.voiceDiagnosisService - 声诊分析服务
   * @param {Object} dependencies.fiveToneModel - 五音分析模型
   * @param {Object} dependencies.voiceMLModel - 声音ML模型(可选)
   * @param {Object} dependencies.userProfileService - 用户档案服务
   * @param {Object} dependencies.logger - 日志服务
   */
  constructor (dependencies) {
    this.dbClient = dependencies.dbClient
    this.voiceDiagnosisService = dependencies.voiceDiagnosisService
    this.fiveToneModel = dependencies.fiveToneModel
    this.voiceMLModel = dependencies.voiceMLModel
    this.userProfileService = dependencies.userProfileService
    this.logger = dependencies.logger || console

    // 模型调整参数
    this.modelAdjustmentParams = {
      // 权重调整参数
      weightAdjustmentRate: 0.05,
      // 阈值调整参数
      thresholdAdjustmentRate: 0.02,
      // 专家反馈权重
      expertFeedbackWeight: 0.8,
      // 普通用户反馈权重
      regularUserFeedbackWeight: 0.3,
      // 最小反馈样本量
      minFeedbackSamplesForAdjustment: 5,
      // 准确性阈值
      accuracyThresholdForAdjustment: 0.7
    }

    // 特征权重调整记录
    this.featureWeightAdjustments = {}

    // 用户学习记录
    this.userLearningData = {}
  }

  /**
   * 初始化服务
   * @returns {Promise<void>}
   */
  async initialize () {
    try {
      // 加载历史调整记录
      await this.loadAdjustmentHistory()

      // 加载用户学习数据
      await this.loadUserLearningData()

      this.logger.info('声诊自适应学习服务初始化完成')
    } catch (error) {
      this.logger.error('声诊自适应学习服务初始化失败', error)
      throw error
    }
  }

  /**
   * 加载模型调整历史
   * @returns {Promise<void>}
   */
  async loadAdjustmentHistory () {
    try {
      const collection = this.dbClient.collection('voice_model_adjustments')
      const adjustments = await collection.find({}).sort({ timestamp: -1 }).limit(100).toArray()

      // 整理数据
      for (const adjustment of adjustments) {
        if (adjustment.featureType && adjustment.featureName) {
          if (!this.featureWeightAdjustments[adjustment.featureType]) {
            this.featureWeightAdjustments[adjustment.featureType] = {}
          }
          this.featureWeightAdjustments[adjustment.featureType][adjustment.featureName] = adjustment.newWeight
        }
      }

      this.logger.info(`加载了${adjustments.length}条模型调整记录`)
    } catch (error) {
      this.logger.warn('加载模型调整历史失败，使用默认权重', error)
      // 使用默认权重
      this.initializeDefaultWeights()
    }
  }

  /**
   * 初始化默认权重
   */
  initializeDefaultWeights () {
    // 声音特征权重
    this.featureWeightAdjustments.timbre = {
      pitch: 0.25,
      intensity: 0.25,
      rhythm: 0.25,
      quality: 0.25
    }

    // 五音类型权重
    this.featureWeightAdjustments.toneType = {
      gong: 0.2,
      shang: 0.2,
      jue: 0.2,
      zhi: 0.2,
      yu: 0.2
    }

    // 病证指标权重
    this.featureWeightAdjustments.disharmony = {
      primarySymptoms: 0.6,
      secondarySymptoms: 0.3,
      constitutionFactor: 0.1
    }
  }

  /**
   * 加载用户学习数据
   * @returns {Promise<void>}
   */
  async loadUserLearningData () {
    try {
      const collection = this.dbClient.collection('user_voice_learning')
      const userData = await collection.find({}).toArray()

      // 整理用户学习数据
      for (const data of userData) {
        this.userLearningData[data.userId] = {
          preferredFeatures: data.preferredFeatures || {},
          diagnosticAccuracy: data.diagnosticAccuracy || {},
          feedbackCount: data.feedbackCount || 0,
          lastUpdated: data.lastUpdated || new Date()
        }
      }

      this.logger.info(`加载了${userData.length}条用户学习数据`)
    } catch (error) {
      this.logger.warn('加载用户学习数据失败', error)
    }
  }

  /**
   * 处理用户反馈
   * @param {Object} feedback - 用户反馈
   * @param {string} feedback.userId - 用户ID
   * @param {string} feedback.diagnosisId - 诊断结果ID
   * @param {number} feedback.satisfactionRating - 满意度评分(1-5)
   * @param {boolean} feedback.isAccurate - 用户认为是否准确
   * @param {string} feedback.comment - 反馈评论
   * @param {Array} feedback.suggestedCorrections - 建议的修正
   * @param {boolean} feedback.isExpertFeedback - 是否为专家反馈
   * @returns {Promise<Object>} - 处理结果
   */
  async processFeedback (feedback) {
    try {
      // 验证必要参数
      if (!feedback.userId || !feedback.diagnosisId) {
        throw new Error('必须提供用户ID和诊断结果ID')
      }

      // 获取诊断结果
      const diagnosisResult = await this.fetchDiagnosisResult(feedback.diagnosisId)
      if (!diagnosisResult) {
        throw new Error(`未找到ID为${feedback.diagnosisId}的诊断结果`)
      }

      // 更新用户学习数据
      await this.updateUserLearningData(feedback, diagnosisResult)

      // 记录反馈
      await this.saveFeedback(feedback, diagnosisResult)

      // 评估是否需要调整模型
      const shouldAdjustModel = this.shouldAdjustModel(feedback)

      // 如果需要，调整模型
      if (shouldAdjustModel) {
        await this.adjustModelBasedOnFeedback(feedback, diagnosisResult)
      }

      return {
        success: true,
        message: '反馈处理成功',
        modelAdjusted: shouldAdjustModel
      }
    } catch (error) {
      this.logger.error('处理用户反馈失败', error)
      throw error
    }
  }

  /**
   * 获取诊断结果
   * @param {string} diagnosisId - 诊断结果ID
   * @returns {Promise<Object>} - 诊断结果
   */
  async fetchDiagnosisResult (diagnosisId) {
    try {
      const collection = this.dbClient.collection('voice_diagnosis_results')
      return await collection.findOne({ _id: diagnosisId })
    } catch (error) {
      this.logger.error(`获取诊断结果失败: ${diagnosisId}`, error)
      throw error
    }
  }

  /**
   * 更新用户学习数据
   * @param {Object} feedback - 用户反馈
   * @param {Object} diagnosisResult - 诊断结果
   * @returns {Promise<void>}
   */
  async updateUserLearningData (feedback, diagnosisResult) {
    const userId = feedback.userId

    // 初始化用户数据
    if (!this.userLearningData[userId]) {
      this.userLearningData[userId] = {
        preferredFeatures: {},
        diagnosticAccuracy: {},
        feedbackCount: 0,
        lastUpdated: new Date()
      }
    }

    const userData = this.userLearningData[userId]

    // 更新反馈计数
    userData.feedbackCount += 1

    // 如果用户认为诊断准确，更新偏好特征
    if (feedback.isAccurate && diagnosisResult) {
      // 更新声音特征偏好
      if (diagnosisResult.timbreAnalysis && diagnosisResult.timbreAnalysis.features) {
        for (const feature of diagnosisResult.timbreAnalysis.features) {
          if (!userData.preferredFeatures.timbre) {
            userData.preferredFeatures.timbre = {}
          }

          userData.preferredFeatures.timbre[feature] =
            (userData.preferredFeatures.timbre[feature] || 0) + 1
        }
      }

      // 更新病证偏好
      if (diagnosisResult.potentialDisharmonies && diagnosisResult.potentialDisharmonies.length > 0) {
        for (const disharmony of diagnosisResult.potentialDisharmonies) {
          if (!userData.preferredFeatures.disharmony) {
            userData.preferredFeatures.disharmony = {}
          }

          userData.preferredFeatures.disharmony[disharmony.name] =
            (userData.preferredFeatures.disharmony[disharmony.name] || 0) + 1
        }
      }
    }

    // 更新准确性统计
    if (feedback.isAccurate !== undefined) {
      if (!userData.diagnosticAccuracy.totalCount) {
        userData.diagnosticAccuracy = {
          totalCount: 0,
          accurateCount: 0,
          accuracyRate: 0
        }
      }

      userData.diagnosticAccuracy.totalCount += 1
      if (feedback.isAccurate) {
        userData.diagnosticAccuracy.accurateCount += 1
      }

      userData.diagnosticAccuracy.accuracyRate =
        userData.diagnosticAccuracy.accurateCount / userData.diagnosticAccuracy.totalCount
    }

    // 更新时间戳
    userData.lastUpdated = new Date()

    // 保存到数据库
    try {
      const collection = this.dbClient.collection('user_voice_learning')
      await collection.updateOne(
        { userId },
        {
          $set: {
            preferredFeatures: userData.preferredFeatures,
            diagnosticAccuracy: userData.diagnosticAccuracy,
            feedbackCount: userData.feedbackCount,
            lastUpdated: userData.lastUpdated
          }
        },
        { upsert: true }
      )
    } catch (error) {
      this.logger.error(`保存用户学习数据失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 保存反馈记录
   * @param {Object} feedback - 用户反馈
   * @param {Object} diagnosisResult - 诊断结果
   * @returns {Promise<void>}
   */
  async saveFeedback (feedback, diagnosisResult) {
    try {
      const collection = this.dbClient.collection('voice_feedback')

      await collection.insertOne({
        userId: feedback.userId,
        diagnosisId: feedback.diagnosisId,
        satisfactionRating: feedback.satisfactionRating,
        isAccurate: feedback.isAccurate,
        comment: feedback.comment,
        suggestedCorrections: feedback.suggestedCorrections,
        isExpertFeedback: feedback.isExpertFeedback,
        diagnosisSummary: this.extractDiagnosisSummary(diagnosisResult),
        createdAt: new Date()
      })
    } catch (error) {
      this.logger.error('保存反馈记录失败', error)
      throw error
    }
  }

  /**
   * 提取诊断结果摘要
   * @param {Object} diagnosisResult - 诊断结果
   * @returns {Object} - 诊断结果摘要
   */
  extractDiagnosisSummary (diagnosisResult) {
    if (!diagnosisResult) return null

    return {
      dominantTone: diagnosisResult.dominantTone,
      associatedOrgan: diagnosisResult.associatedOrgan,
      timbreFeatures: diagnosisResult.timbreAnalysis ? diagnosisResult.timbreAnalysis.features : [],
      primaryDisharmony: diagnosisResult.potentialDisharmonies && diagnosisResult.potentialDisharmonies.length > 0
        ? diagnosisResult.potentialDisharmonies[0].name
        : null
    }
  }

  /**
   * 判断是否应该调整模型
   * @param {Object} feedback - 用户反馈
   * @returns {boolean} - 是否应该调整模型
   */
  shouldAdjustModel (feedback) {
    // 专家反馈总是考虑调整模型
    if (feedback.isExpertFeedback) {
      return true
    }

    // 如果是普通用户，需要满足一定条件
    const userId = feedback.userId
    if (!this.userLearningData[userId]) return false

    const userData = this.userLearningData[userId]

    // 如果用户反馈太少，不调整
    if (userData.feedbackCount < this.modelAdjustmentParams.minFeedbackSamplesForAdjustment) {
      return false
    }

    // 如果用户指出诊断不准确，考虑调整
    if (feedback.isAccurate === false) {
      return true
    }

    // 如果满意度很低，考虑调整
    if (feedback.satisfactionRating !== undefined && feedback.satisfactionRating < 3) {
      return true
    }

    // 如果用户提供了具体的修正建议，考虑调整
    if (feedback.suggestedCorrections && feedback.suggestedCorrections.length > 0) {
      return true
    }

    return false
  }

  /**
   * 基于反馈调整模型
   * @param {Object} feedback - 用户反馈
   * @param {Object} diagnosisResult - 诊断结果
   * @returns {Promise<void>}
   */
  async adjustModelBasedOnFeedback (feedback, diagnosisResult) {
    try {
      // 根据用户类型确定权重
      const adjustmentWeight = feedback.isExpertFeedback
        ? this.modelAdjustmentParams.expertFeedbackWeight
        : this.modelAdjustmentParams.regularUserFeedbackWeight

      const adjustments = []

      // 处理五音分析调整
      if (diagnosisResult.dominantTone && feedback.suggestedCorrections) {
        const toneSuggestion = feedback.suggestedCorrections.find(c => c.type === 'dominantTone')
        if (toneSuggestion && toneSuggestion.value) {
          // 如果用户或专家建议了不同的五音类型
          adjustments.push(await this.adjustToneDetection(
            diagnosisResult.dominantTone,
            toneSuggestion.value,
            adjustmentWeight
          ))
        }
      }

      // 处理病证识别调整
      if (diagnosisResult.potentialDisharmonies && feedback.suggestedCorrections) {
        const disharmonySuggestion = feedback.suggestedCorrections.find(c => c.type === 'primaryDisharmony')
        if (disharmonySuggestion && disharmonySuggestion.value) {
          // 获取当前主要病证
          const primaryDisharmony = diagnosisResult.potentialDisharmonies.length > 0
            ? diagnosisResult.potentialDisharmonies[0].name
            : null

          if (primaryDisharmony !== disharmonySuggestion.value) {
            // 如果用户或专家建议了不同的主要病证
            adjustments.push(await this.adjustDisharmonyDetection(
              primaryDisharmony,
              disharmonySuggestion.value,
              diagnosisResult.timbreAnalysis?.features || [],
              adjustmentWeight
            ))
          }
        }
      }

      // 如果进行了任何调整，更新模型
      if (adjustments.length > 0) {
        // 更新ML模型（如果存在）
        if (this.voiceMLModel) {
          await this.updateMLModel(feedback, diagnosisResult, adjustments)
        }

        // 通知声诊服务更新参数
        if (this.voiceDiagnosisService) {
          this.voiceDiagnosisService.updateParameters(this.featureWeightAdjustments)
        }

        // 记录调整结果
        await this.saveModelAdjustments(adjustments, feedback)
      }
    } catch (error) {
      this.logger.error('调整模型失败', error)
      throw error
    }
  }

  /**
   * 调整五音检测
   * @param {string} currentTone - 当前检测的音调
   * @param {string} suggestedTone - 建议的音调
   * @param {number} weight - 调整权重
   * @returns {Promise<Object>} - 调整结果
   */
  async adjustToneDetection (currentTone, suggestedTone, weight) {
    // 降低当前识别的权重
    if (this.featureWeightAdjustments.toneType[currentTone]) {
      this.featureWeightAdjustments.toneType[currentTone] -= this.modelAdjustmentParams.weightAdjustmentRate * weight
      // 确保权重不小于最小值
      this.featureWeightAdjustments.toneType[currentTone] = Math.max(0.05, this.featureWeightAdjustments.toneType[currentTone])
    }

    // 提高建议的权重
    if (this.featureWeightAdjustments.toneType[suggestedTone]) {
      this.featureWeightAdjustments.toneType[suggestedTone] += this.modelAdjustmentParams.weightAdjustmentRate * weight
      // 确保权重不超过最大值
      this.featureWeightAdjustments.toneType[suggestedTone] = Math.min(0.5, this.featureWeightAdjustments.toneType[suggestedTone])
    }

    // 归一化权重
    this.normalizeWeights(this.featureWeightAdjustments.toneType)

    return {
      featureType: 'toneType',
      currentValue: currentTone,
      suggestedValue: suggestedTone,
      newWeights: { ...this.featureWeightAdjustments.toneType }
    }
  }

  /**
   * 调整病证检测
   * @param {string} currentDisharmony - 当前检测的病证
   * @param {string} suggestedDisharmony - 建议的病证
   * @param {Array} features - 声音特征
   * @param {number} weight - 调整权重
   * @returns {Promise<Object>} - 调整结果
   */
  async adjustDisharmonyDetection (currentDisharmony, suggestedDisharmony, features, weight) {
    // 强化或弱化特定声音特征与病证的关联
    if (features.length > 0 && this.featureWeightAdjustments.timbre) {
      for (const feature of features) {
        if (this.featureWeightAdjustments.timbre[feature]) {
          // 如果当前病证错误，降低这些特征的权重
          if (currentDisharmony) {
            this.featureWeightAdjustments.timbre[feature] -= this.modelAdjustmentParams.weightAdjustmentRate * weight * 0.5
            this.featureWeightAdjustments.timbre[feature] = Math.max(0.05, this.featureWeightAdjustments.timbre[feature])
          }

          // 如果存在建议的病证，增加这些特征的权重
          if (suggestedDisharmony) {
            this.featureWeightAdjustments.timbre[feature] += this.modelAdjustmentParams.weightAdjustmentRate * weight * 0.5
            this.featureWeightAdjustments.timbre[feature] = Math.min(0.5, this.featureWeightAdjustments.timbre[feature])
          }
        }
      }

      // 归一化权重
      this.normalizeWeights(this.featureWeightAdjustments.timbre)
    }

    // 调整病证识别相关参数
    if (this.featureWeightAdjustments.disharmony) {
      // 如果建议权重更高，增加主要症状的权重
      if (suggestedDisharmony) {
        this.featureWeightAdjustments.disharmony.primarySymptoms += this.modelAdjustmentParams.weightAdjustmentRate * weight * 0.2
        this.featureWeightAdjustments.disharmony.primarySymptoms = Math.min(0.7, this.featureWeightAdjustments.disharmony.primarySymptoms)
      }

      // 归一化权重
      this.normalizeWeights(this.featureWeightAdjustments.disharmony)
    }

    return {
      featureType: 'disharmony',
      currentValue: currentDisharmony,
      suggestedValue: suggestedDisharmony,
      affectedFeatures: features,
      newTimbreWeights: { ...this.featureWeightAdjustments.timbre },
      newDisharmonyWeights: { ...this.featureWeightAdjustments.disharmony }
    }
  }

  /**
   * 归一化权重
   * @param {Object} weights - 权重对象
   */
  normalizeWeights (weights) {
    const sum = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    if (sum <= 0) return

    for (const key in weights) {
      weights[key] /= sum
    }
  }

  /**
   * 更新ML模型
   * @param {Object} feedback - 用户反馈
   * @param {Object} diagnosisResult - 诊断结果
   * @param {Array} adjustments - 权重调整
   * @returns {Promise<void>}
   */
  async updateMLModel (feedback, diagnosisResult, adjustments) {
    // 如果没有ML模型，直接返回
    if (!this.voiceMLModel) return

    try {
      // 收集训练数据
      const trainingData = {
        feedback,
        diagnosisResult,
        adjustments,
        timestamp: new Date()
      }

      // 通知ML模型进行更新
      await this.voiceMLModel.updateFromFeedback(trainingData)

      this.logger.info('ML模型更新成功', { userId: feedback.userId })
    } catch (error) {
      this.logger.error('更新ML模型失败', error)
      // 继续处理，不抛出异常
    }
  }

  /**
   * 保存模型调整记录
   * @param {Array} adjustments - 调整记录
   * @param {Object} feedback - 用户反馈
   * @returns {Promise<void>}
   */
  async saveModelAdjustments (adjustments, feedback) {
    try {
      const collection = this.dbClient.collection('voice_model_adjustments')

      const records = adjustments.map(adjustment => ({
        ...adjustment,
        feedbackId: feedback._id,
        userId: feedback.userId,
        isExpertFeedback: feedback.isExpertFeedback,
        timestamp: new Date()
      }))

      await collection.insertMany(records)

      this.logger.info(`保存了${records.length}条模型调整记录`)
    } catch (error) {
      this.logger.error('保存模型调整记录失败', error)
      throw error
    }
  }

  /**
   * 获取模型调整历史
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制条数
   * @param {number} options.offset - 偏移量
   * @param {string} options.featureType - 特征类型
   * @returns {Promise<Array>} - 调整历史记录
   */
  async getAdjustmentHistory (options = {}) {
    try {
      const { limit = 50, offset = 0, featureType } = options

      const collection = this.dbClient.collection('voice_model_adjustments')

      const query = {}
      if (featureType) query.featureType = featureType

      const adjustments = await collection.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .toArray()

      const total = await collection.countDocuments(query)

      return {
        data: adjustments,
        total,
        limit,
        offset
      }
    } catch (error) {
      this.logger.error('获取模型调整历史失败', error)
      throw error
    }
  }

  /**
   * 获取用户个性化调整参数
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 个性化参数
   */
  async getUserPersonalization (userId) {
    try {
      // 如果没有此用户的数据，返回空对象
      if (!this.userLearningData[userId]) {
        return {}
      }

      const userData = this.userLearningData[userId]

      // 根据用户的偏好特征，计算个性化参数
      const personalization = {
        tonePreferences: {},
        disharmonyPreferences: {}
      }

      // 分析声音特征偏好
      if (userData.preferredFeatures.timbre) {
        // 找出用户最常确认准确的声音特征
        const timbreFeatures = Object.entries(userData.preferredFeatures.timbre)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        // 使用这些特征推断五音偏好
        for (const [feature, count] of timbreFeatures) {
          // 根据特征推断相关五音类型
          const relatedTones = this.inferTonesFromFeature(feature)
          for (const tone of relatedTones) {
            personalization.tonePreferences[tone] = (personalization.tonePreferences[tone] || 0) + count
          }
        }
      }

      // 分析病证偏好
      if (userData.preferredFeatures.disharmony) {
        // 找出用户最常确认准确的病证
        personalization.disharmonyPreferences = Object.entries(userData.preferredFeatures.disharmony)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .reduce((obj, [key, value]) => {
            obj[key] = value
            return obj
          }, {})
      }

      return personalization
    } catch (error) {
      this.logger.error(`获取用户个性化参数失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 从声音特征推断相关五音类型
   * @param {string} feature - 声音特征
   * @returns {Array} - 相关五音类型
   */
  inferTonesFromFeature (feature) {
    // 特征与五音的关联映射
    const featureToneMap = {
      // 高音特征
      高亢: ['徵', '商'], // 高亢声音常与心火或肺金有关
      尖锐: ['徵', '角'], // 尖锐声音常与心火或肝木有关
      清越: ['商'], // 清越声音主要与肺金有关

      // 低音特征
      低沉: ['羽', '宫'], // 低沉声音常与肾水或脾土有关
      沉闷: ['羽'], // 沉闷声音主要与肾水有关
      深沉: ['羽'], // 深沉声音主要与肾水有关

      // 强度特征
      洪亮: ['徵', '商'], // 洪亮声音常与心火或肺金有关
      无力: ['宫', '羽'], // 无力声音常与脾土或肾水有关
      微弱: ['宫'], // 微弱声音主要与脾土有关

      // 质量特征
      圆润: ['宫'], // 圆润声音主要与脾土有关
      嘶哑: ['商'], // 嘶哑声音主要与肺金有关
      粗糙: ['角'], // 粗糙声音主要与肝木有关

      // 节奏特征
      急促: ['徵', '角'], // 急促声音常与心火或肝木有关
      缓慢: ['宫', '羽'], // 缓慢声音常与脾土或肾水有关
      不稳: ['角'] // 不稳声音主要与肝木有关
    }

    // 返回与特征相关的五音，如果没有映射则返回空数组
    return featureToneMap[feature] || []
  }

  /**
   * 应用个性化参数到诊断结果
   * @param {string} userId - 用户ID
   * @param {Object} diagnosisResult - 诊断结果
   * @returns {Promise<Object>} - 个性化后的诊断结果
   */
  async personalizeResult (userId, diagnosisResult) {
    try {
      // 如果没有诊断结果，直接返回
      if (!diagnosisResult) return diagnosisResult

      // 获取用户个性化参数
      const personalization = await this.getUserPersonalization(userId)

      // 如果没有个性化数据，或者诊断结果已经有很高置信度，不进行调整
      if (Object.keys(personalization).length === 0) {
        return diagnosisResult
      }

      // 创建结果副本
      const personalizedResult = JSON.parse(JSON.stringify(diagnosisResult))

      // 调整可能性较高的病证排序（如果有用户偏好）
      if (personalization.disharmonyPreferences &&
          personalizedResult.potentialDisharmonies &&
          personalizedResult.potentialDisharmonies.length > 1) {
        // 为每个病证分配额外的个性化分数
        personalizedResult.potentialDisharmonies.forEach(disharmony => {
          const personalScore = personalization.disharmonyPreferences[disharmony.name] || 0
          disharmony.originalConfidence = disharmony.confidence

          // 调整置信度，但要保持在合理范围内
          const adjustment = personalScore * 0.02 // 小幅调整
          disharmony.confidence = Math.min(0.95, disharmony.confidence + adjustment)

          // 标记这是个性化的结果
          disharmony.personalized = personalScore > 0
        })

        // 重新排序
        personalizedResult.potentialDisharmonies.sort((a, b) => b.confidence - a.confidence)
      }

      // 添加个性化标记
      personalizedResult.isPersonalized = true

      return personalizedResult
    } catch (error) {
      this.logger.error(`应用个性化参数失败: ${userId}`, error)
      // 发生错误时返回原始结果
      return diagnosisResult
    }
  }
}

module.exports = VoiceAdaptiveLearningService
