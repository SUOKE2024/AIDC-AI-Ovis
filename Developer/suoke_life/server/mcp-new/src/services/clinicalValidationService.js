/**
 * 临床验证管理服务
 * 负责处理声诊系统的临床验证流程，包括验证案例收集、专家评审和结果分析
 */
const path = require('path')
const fs = require('fs').promises
const { ObjectId } = require('mongodb')

class ClinicalValidationService {
  /**
   * 构造函数
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.voiceDiagnosisService - 声诊分析服务
   * @param {Object} dependencies.voiceModelAdjuster - 声诊模型调整器
   * @param {Object} dependencies.voiceMLModel - 声音ML模型(可选)
   * @param {Object} dependencies.logger - 日志服务
   */
  constructor (dependencies) {
    this.dbClient = dependencies.dbClient
    this.voiceDiagnosisService = dependencies.voiceDiagnosisService
    this.voiceModelAdjuster = dependencies.voiceModelAdjuster
    this.voiceMLModel = dependencies.voiceMLModel
    this.logger = dependencies.logger || console

    // 验证相关集合名称
    this.collections = {
      validationCases: 'voice_validation_cases',
      expertReviews: 'voice_expert_reviews',
      validationResults: 'voice_validation_results',
      performanceMetrics: 'voice_performance_metrics'
    }

    // 验证状态枚举
    this.validationStatus = {
      PENDING: 'pending', // 等待验证
      IN_REVIEW: 'in_review', // 专家评审中
      COMPLETED: 'completed', // 验证完成
      INSUFFICIENT: 'insufficient_data' // 数据不足，无法验证
    }

    // 验证分类
    this.validationCategories = [
      'clinical_case', // 临床案例
      'research_sample', // 研究样本
      'teaching_material', // 教学材料
      'model_training' // 模型训练
    ]

    // 验证批次当前ID
    this.currentBatchId = null
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

      // 加载当前验证批次
      await this.loadCurrentBatch()

      this.logger.info('临床验证管理服务初始化完成')
    } catch (error) {
      this.logger.error('临床验证管理服务初始化失败', error)
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
      // 为验证案例集合创建索引
      await this.dbClient.collection(this.collections.validationCases).createIndexes([
        { key: { caseId: 1 }, name: 'caseId_index', unique: true },
        { key: { status: 1 }, name: 'status_index' },
        { key: { category: 1 }, name: 'category_index' },
        { key: { batchId: 1 }, name: 'batchId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      // 为专家评审集合创建索引
      await this.dbClient.collection(this.collections.expertReviews).createIndexes([
        { key: { caseId: 1 }, name: 'caseId_index' },
        { key: { expertId: 1 }, name: 'expertId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_index' }
      ])

      // 为验证结果集合创建索引
      await this.dbClient.collection(this.collections.validationResults).createIndexes([
        { key: { batchId: 1 }, name: 'batchId_index', unique: true },
        { key: { completedAt: -1 }, name: 'completedAt_index' }
      ])

      // 为性能指标集合创建索引
      await this.dbClient.collection(this.collections.performanceMetrics).createIndexes([
        { key: { metricName: 1 }, name: 'metricName_index' },
        { key: { batchId: 1 }, name: 'batchId_index' },
        { key: { timestamp: -1 }, name: 'timestamp_index' }
      ])

      this.logger.info('创建索引完成')
    } catch (error) {
      this.logger.error('创建索引失败', error)
      throw error
    }
  }

  /**
   * 加载当前验证批次
   * @returns {Promise<void>}
   */
  async loadCurrentBatch () {
    try {
      // 查询最新批次
      const validationResults = this.dbClient.collection(this.collections.validationResults)
      const latestBatch = await validationResults.find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      if (latestBatch.length > 0) {
        // 如果存在未完成的批次，使用它
        if (latestBatch[0].status !== 'completed') {
          this.currentBatchId = latestBatch[0].batchId
          this.logger.info(`加载未完成的验证批次: ${this.currentBatchId}`)
        } else {
          // 否则创建新批次
          await this.createNewBatch()
        }
      } else {
        // 不存在批次，创建新批次
        await this.createNewBatch()
      }
    } catch (error) {
      this.logger.error('加载当前验证批次失败', error)
      throw error
    }
  }

  /**
   * 创建新的验证批次
   * @returns {Promise<string>} - 新批次ID
   */
  async createNewBatch () {
    try {
      const batchId = `batch-${Date.now()}`

      // 创建批次记录
      const validationResults = this.dbClient.collection(this.collections.validationResults)
      await validationResults.insertOne({
        batchId,
        status: 'in_progress',
        createdAt: new Date(),
        completedAt: null,
        caseCount: 0,
        reviewCount: 0,
        metrics: {}
      })

      this.currentBatchId = batchId
      this.logger.info(`创建新验证批次: ${batchId}`)

      return batchId
    } catch (error) {
      this.logger.error('创建新验证批次失败', error)
      throw error
    }
  }

  /**
   * 提交临床验证案例
   * @param {Object} caseData - 案例数据
   * @returns {Promise<Object>} - 处理结果
   */
  async submitValidationCase (caseData) {
    try {
      // 验证必要字段
      this.validateCaseData(caseData)

      // 生成案例ID
      const caseId = caseData.caseId || `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // 准备案例记录
      const validationCase = {
        caseId,
        patientInfo: caseData.patientInfo,
        traditionalDiagnosis: caseData.traditionalDiagnosis,
        audioSampleId: caseData.audioSampleId,
        audioData: caseData.audioData, // 可选，直接提供的音频数据
        category: caseData.category || 'clinical_case',
        status: this.validationStatus.PENDING,
        batchId: this.currentBatchId,
        submittedBy: caseData.submittedBy,
        createdAt: new Date(),
        voiceDiagnosis: null, // 声诊分析结果，初始为空
        reviews: [], // 专家评审列表，初始为空
        notes: caseData.notes || ''
      }

      // 插入案例记录
      const validationCases = this.dbClient.collection(this.collections.validationCases)

      // 检查是否已存在该案例
      const existingCase = await validationCases.findOne({ caseId })
      if (existingCase) {
        return {
          success: false,
          message: `案例ID已存在: ${caseId}`,
          caseId
        }
      }

      // 插入新案例
      await validationCases.insertOne(validationCase)

      // 更新批次计数
      await this.updateBatchCaseCount()

      // 如果提供了音频数据，立即进行声诊分析
      if (caseData.audioData && this.voiceDiagnosisService) {
        const diagnosisResult = await this.performVoiceDiagnosis(caseId, caseData.audioData)
        return {
          success: true,
          message: '验证案例提交成功，并已完成声诊分析',
          caseId,
          diagnosisResult
        }
      }

      return {
        success: true,
        message: '验证案例提交成功',
        caseId
      }
    } catch (error) {
      this.logger.error('提交验证案例失败', error)
      throw error
    }
  }

  /**
   * 验证案例数据
   * @param {Object} caseData - 案例数据
   * @throws {Error} - 如果数据无效
   */
  validateCaseData (caseData) {
    if (!caseData.patientInfo) {
      throw new Error('patientInfo是必须的')
    }

    if (!caseData.traditionalDiagnosis) {
      throw new Error('traditionalDiagnosis是必须的')
    }

    if (!caseData.traditionalDiagnosis.diagnosis) {
      throw new Error('traditionalDiagnosis.diagnosis是必须的')
    }

    if (!caseData.audioSampleId && !caseData.audioData) {
      throw new Error('必须提供audioSampleId或audioData')
    }

    if (caseData.category && !this.validationCategories.includes(caseData.category)) {
      throw new Error(`无效的案例类别: ${caseData.category}`)
    }
  }

  /**
   * 更新批次案例计数
   * @returns {Promise<void>}
   */
  async updateBatchCaseCount () {
    try {
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const count = await validationCases.countDocuments({ batchId: this.currentBatchId })

      const validationResults = this.dbClient.collection(this.collections.validationResults)
      await validationResults.updateOne(
        { batchId: this.currentBatchId },
        { $set: { caseCount: count } }
      )
    } catch (error) {
      this.logger.error('更新批次案例计数失败', error)
      // 不抛出异常，以免中断主流程
    }
  }

  /**
   * 对案例进行声诊分析
   * @param {string} caseId - 案例ID
   * @param {Buffer} audioData - 音频数据
   * @returns {Promise<Object>} - 诊断结果
   */
  async performVoiceDiagnosis (caseId, audioData) {
    try {
      if (!this.voiceDiagnosisService) {
        throw new Error('声诊分析服务不可用')
      }

      // 获取案例信息
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const validationCase = await validationCases.findOne({ caseId })

      if (!validationCase) {
        throw new Error(`未找到案例: ${caseId}`)
      }

      // 进行声诊分析
      const analysisResult = await this.voiceDiagnosisService.analyzeVoice(audioData, {
        isValidationCase: true,
        caseId,
        patientInfo: validationCase.patientInfo
      })

      // 更新案例中的声诊分析结果
      await validationCases.updateOne(
        { caseId },
        {
          $set: {
            voiceDiagnosis: {
              results: analysisResult,
              analysisTime: new Date()
            },
            status: this.validationStatus.IN_REVIEW
          }
        }
      )

      this.logger.info(`完成案例声诊分析: ${caseId}`)

      return analysisResult
    } catch (error) {
      this.logger.error(`声诊分析失败: ${caseId}`, error)

      // 更新案例状态
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      await validationCases.updateOne(
        { caseId },
        {
          $set: {
            status: this.validationStatus.INSUFFICIENT,
            diagnosisError: error.message
          }
        }
      )

      throw error
    }
  }

  /**
   * 提交专家评审
   * @param {Object} reviewData - 评审数据
   * @returns {Promise<Object>} - 处理结果
   */
  async submitExpertReview (reviewData) {
    try {
      // 验证必要字段
      if (!reviewData.caseId) {
        throw new Error('caseId是必须的')
      }

      if (!reviewData.expertId) {
        throw new Error('expertId是必须的')
      }

      if (reviewData.concordanceRating === undefined || reviewData.concordanceRating === null) {
        throw new Error('concordanceRating是必须的')
      }

      // 获取案例信息
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const validationCase = await validationCases.findOne({ caseId: reviewData.caseId })

      if (!validationCase) {
        throw new Error(`未找到案例: ${reviewData.caseId}`)
      }

      if (!validationCase.voiceDiagnosis) {
        throw new Error(`案例还未进行声诊分析: ${reviewData.caseId}`)
      }

      // 准备评审记录
      const review = {
        reviewId: `review-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        caseId: reviewData.caseId,
        expertId: reviewData.expertId,
        concordanceRating: reviewData.concordanceRating,
        concordanceAnalysis: reviewData.concordanceAnalysis || {},
        suggestions: reviewData.suggestions || [],
        comments: reviewData.comments || '',
        isAccurate: reviewData.isAccurate,
        createdAt: new Date()
      }

      // 保存评审记录
      const expertReviews = this.dbClient.collection(this.collections.expertReviews)
      await expertReviews.insertOne(review)

      // 更新案例中的评审列表
      await validationCases.updateOne(
        { caseId: reviewData.caseId },
        {
          $push: { reviews: review.reviewId },
          $set: { status: this.validationStatus.COMPLETED }
        }
      )

      // 更新批次评审计数
      await this.updateBatchReviewCount()

      // 检查评审结果，如果需要则触发模型调整
      if (reviewData.shouldAdjustModel) {
        await this.triggerModelAdjustment(reviewData.caseId)
      }

      return {
        success: true,
        message: '专家评审提交成功',
        reviewId: review.reviewId
      }
    } catch (error) {
      this.logger.error('提交专家评审失败', error)
      throw error
    }
  }

  /**
   * 更新批次评审计数
   * @returns {Promise<void>}
   */
  async updateBatchReviewCount () {
    try {
      const expertReviews = this.dbClient.collection(this.collections.expertReviews)
      const validationCases = this.dbClient.collection(this.collections.validationCases)

      // 获取当前批次的所有案例ID
      const cases = await validationCases.find({ batchId: this.currentBatchId }).toArray()
      const caseIds = cases.map(c => c.caseId)

      // 计算评审数量
      const count = await expertReviews.countDocuments({
        caseId: { $in: caseIds }
      })

      const validationResults = this.dbClient.collection(this.collections.validationResults)
      await validationResults.updateOne(
        { batchId: this.currentBatchId },
        { $set: { reviewCount: count } }
      )
    } catch (error) {
      this.logger.error('更新批次评审计数失败', error)
      // 不抛出异常，以免中断主流程
    }
  }

  /**
   * 触发模型调整
   * @param {string} caseId - 案例ID
   * @returns {Promise<boolean>} - 是否成功触发调整
   */
  async triggerModelAdjustment (caseId) {
    try {
      if (!this.voiceModelAdjuster) {
        this.logger.warn('声诊模型调整器不可用，跳过模型调整')
        return false
      }

      // 获取案例及其评审
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const validationCase = await validationCases.findOne({ caseId })

      if (!validationCase || !validationCase.reviews || validationCase.reviews.length === 0) {
        return false
      }

      const expertReviews = this.dbClient.collection(this.collections.expertReviews)
      const reviews = await expertReviews.find({
        reviewId: { $in: validationCase.reviews }
      }).toArray()

      if (reviews.length === 0) {
        return false
      }

      // 整合评审和案例信息
      const validationResults = []

      for (const review of reviews) {
        validationResults.push({
          voiceDiagnosis: validationCase.voiceDiagnosis,
          traditionalDiagnosis: validationCase.traditionalDiagnosis,
          concordanceAnalysis: review.concordanceAnalysis,
          expertId: review.expertId,
          caseId,
          isAccurate: review.isAccurate
        })
      }

      // 触发模型调整
      const result = await this.voiceModelAdjuster.onClinicalValidationUpdate(validationResults)

      this.logger.info(`模型调整结果: ${result.success ? '成功' : '失败'}`, {
        caseId,
        version: result.version
      })

      return result.success
    } catch (error) {
      this.logger.error(`触发模型调整失败: ${caseId}`, error)
      return false
    }
  }

  /**
   * 完成当前验证批次
   * @returns {Promise<Object>} - 批次总结
   */
  async completeBatch () {
    try {
      if (!this.currentBatchId) {
        throw new Error('没有活动的验证批次')
      }

      // 获取批次信息
      const validationResults = this.dbClient.collection(this.collections.validationResults)
      const batch = await validationResults.findOne({ batchId: this.currentBatchId })

      if (!batch) {
        throw new Error(`未找到批次: ${this.currentBatchId}`)
      }

      // 计算批次指标
      const metrics = await this.calculateBatchMetrics(this.currentBatchId)

      // 更新批次状态为已完成
      await validationResults.updateOne(
        { batchId: this.currentBatchId },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            metrics
          }
        }
      )

      // 保存性能指标
      await this.savePerformanceMetrics(metrics)

      // 创建新批次
      const newBatchId = await this.createNewBatch()

      return {
        success: true,
        completedBatchId: this.currentBatchId,
        newBatchId,
        metrics
      }
    } catch (error) {
      this.logger.error('完成验证批次失败', error)
      throw error
    }
  }

  /**
   * 计算批次指标
   * @param {string} batchId - 批次ID
   * @returns {Promise<Object>} - 批次指标
   */
  async calculateBatchMetrics (batchId) {
    try {
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const expertReviews = this.dbClient.collection(this.collections.expertReviews)

      // 获取所有已完成案例
      const cases = await validationCases.find({
        batchId,
        status: this.validationStatus.COMPLETED
      }).toArray()

      if (cases.length === 0) {
        return {
          caseCount: 0,
          reviewCount: 0,
          accuracyRate: 0,
          concordanceRate: 0
        }
      }

      // 获取案例ID列表
      const caseIds = cases.map(c => c.caseId)

      // 获取所有评审
      const reviews = await expertReviews.find({
        caseId: { $in: caseIds }
      }).toArray()

      // 计算准确率
      let accurateCount = 0
      let totalReviewsWithAccuracy = 0

      for (const review of reviews) {
        if (review.isAccurate !== undefined) {
          totalReviewsWithAccuracy++
          if (review.isAccurate) {
            accurateCount++
          }
        }
      }

      const accuracyRate = totalReviewsWithAccuracy > 0
        ? accurateCount / totalReviewsWithAccuracy
        : 0

      // 计算一致性评分
      let totalConcordanceRating = 0
      let concordanceRatingCount = 0

      for (const review of reviews) {
        if (review.concordanceRating !== undefined) {
          totalConcordanceRating += review.concordanceRating
          concordanceRatingCount++
        }
      }

      const concordanceRate = concordanceRatingCount > 0
        ? totalConcordanceRating / concordanceRatingCount
        : 0

      // 计算各类病证的准确率
      const disharmonyAccuracy = {}
      const disharmonyCounts = {}

      for (const validationCase of cases) {
        if (!validationCase.traditionalDiagnosis || !validationCase.traditionalDiagnosis.diagnosis) {
          continue
        }

        const diagnosis = validationCase.traditionalDiagnosis.diagnosis

        if (!disharmonyCounts[diagnosis]) {
          disharmonyCounts[diagnosis] = {
            total: 0,
            accurate: 0
          }
        }

        const caseReviews = reviews.filter(r => r.caseId === validationCase.caseId)

        for (const review of caseReviews) {
          if (review.isAccurate !== undefined) {
            disharmonyCounts[diagnosis].total++

            if (review.isAccurate) {
              disharmonyCounts[diagnosis].accurate++
            }
          }
        }
      }

      // 计算各病证准确率
      for (const [diagnosis, counts] of Object.entries(disharmonyCounts)) {
        if (counts.total > 0) {
          disharmonyAccuracy[diagnosis] = counts.accurate / counts.total
        }
      }

      return {
        caseCount: cases.length,
        reviewCount: reviews.length,
        accuracyRate,
        concordanceRate,
        disharmonyAccuracy,
        timestamp: new Date()
      }
    } catch (error) {
      this.logger.error(`计算批次指标失败: ${batchId}`, error)
      throw error
    }
  }

  /**
   * 保存性能指标
   * @param {Object} metrics - 性能指标
   * @returns {Promise<void>}
   */
  async savePerformanceMetrics (metrics) {
    try {
      const performanceMetrics = this.dbClient.collection(this.collections.performanceMetrics)

      // 保存总体准确率
      await performanceMetrics.insertOne({
        metricName: 'accuracy_rate',
        value: metrics.accuracyRate,
        batchId: this.currentBatchId,
        timestamp: new Date()
      })

      // 保存一致性评分
      await performanceMetrics.insertOne({
        metricName: 'concordance_rate',
        value: metrics.concordanceRate,
        batchId: this.currentBatchId,
        timestamp: new Date()
      })

      // 保存各病证准确率
      for (const [diagnosis, accuracy] of Object.entries(metrics.disharmonyAccuracy || {})) {
        await performanceMetrics.insertOne({
          metricName: 'disharmony_accuracy',
          diagnosis,
          value: accuracy,
          batchId: this.currentBatchId,
          timestamp: new Date()
        })
      }
    } catch (error) {
      this.logger.error('保存性能指标失败', error)
      // 不抛出异常，以免中断主流程
    }
  }

  /**
   * 获取验证案例列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 案例列表
   */
  async getValidationCases (options = {}) {
    try {
      const {
        batchId,
        status,
        category,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeReviews = false
      } = options

      // 构建查询条件
      const query = {}

      if (batchId) {
        query.batchId = batchId
      }

      if (status) {
        query.status = status
      }

      if (category) {
        query.category = category
      }

      // 构建排序条件
      const sort = {}
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1

      // 执行查询
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const cases = await validationCases.find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray()

      const total = await validationCases.countDocuments(query)

      // 如果需要包含评审信息
      if (includeReviews && cases.length > 0) {
        const caseMap = {}
        const reviewIds = []

        // 收集所有评审ID
        for (const validationCase of cases) {
          caseMap[validationCase.caseId] = validationCase

          if (validationCase.reviews && validationCase.reviews.length > 0) {
            reviewIds.push(...validationCase.reviews)
          }
        }

        // 如果有评审，获取评审详情
        if (reviewIds.length > 0) {
          const expertReviews = this.dbClient.collection(this.collections.expertReviews)
          const reviews = await expertReviews.find({
            reviewId: { $in: reviewIds }
          }).toArray()

          // 将评审添加到案例中
          for (const review of reviews) {
            const validationCase = caseMap[review.caseId]

            if (validationCase) {
              if (!validationCase.reviewDetails) {
                validationCase.reviewDetails = []
              }

              validationCase.reviewDetails.push(review)
            }
          }
        }
      }

      return {
        total,
        data: cases,
        limit,
        offset
      }
    } catch (error) {
      this.logger.error('获取验证案例列表失败', error)
      throw error
    }
  }

  /**
   * 获取验证批次列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 批次列表
   */
  async getValidationBatches (options = {}) {
    try {
      const {
        status,
        limit = 10,
        offset = 0
      } = options

      // 构建查询条件
      const query = {}

      if (status) {
        query.status = status
      }

      // 执行查询
      const validationResults = this.dbClient.collection(this.collections.validationResults)
      const batches = await validationResults.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray()

      const total = await validationResults.countDocuments(query)

      return {
        total,
        data: batches,
        limit,
        offset
      }
    } catch (error) {
      this.logger.error('获取验证批次列表失败', error)
      throw error
    }
  }

  /**
   * 获取验证性能指标历史
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 性能指标历史
   */
  async getPerformanceHistory (options = {}) {
    try {
      const {
        metricName,
        diagnosis,
        limit = 20,
        timeRange = 30 // 默认获取30天
      } = options

      // 构建查询条件
      const query = {}

      if (metricName) {
        query.metricName = metricName
      }

      if (diagnosis) {
        query.diagnosis = diagnosis
      }

      // 如果指定了时间范围
      if (timeRange) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - timeRange)

        query.timestamp = { $gte: startDate }
      }

      // 执行查询
      const performanceMetrics = this.dbClient.collection(this.collections.performanceMetrics)
      const metrics = await performanceMetrics.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray()

      // 整理数据，按指标类型分组
      const metricsGrouped = {}

      for (const metric of metrics) {
        const name = metric.diagnosis
          ? `${metric.metricName}_${metric.diagnosis}`
          : metric.metricName

        if (!metricsGrouped[name]) {
          metricsGrouped[name] = []
        }

        metricsGrouped[name].push({
          value: metric.value,
          timestamp: metric.timestamp,
          batchId: metric.batchId
        })
      }

      // 对每组指标按时间排序
      for (const name in metricsGrouped) {
        metricsGrouped[name].sort((a, b) => a.timestamp - b.timestamp)
      }

      return metricsGrouped
    } catch (error) {
      this.logger.error('获取性能指标历史失败', error)
      throw error
    }
  }

  /**
   * 获取当前验证进度
   * @returns {Promise<Object>} - 验证进度
   */
  async getValidationProgress () {
    try {
      if (!this.currentBatchId) {
        return {
          batchId: null,
          status: 'no_active_batch',
          progress: 0,
          caseCount: 0,
          reviewCount: 0
        }
      }

      // 获取批次信息
      const validationResults = this.dbClient.collection(this.collections.validationResults)
      const batch = await validationResults.findOne({ batchId: this.currentBatchId })

      if (!batch) {
        return {
          batchId: this.currentBatchId,
          status: 'unknown',
          progress: 0,
          caseCount: 0,
          reviewCount: 0
        }
      }

      // 计算进度
      const validationCases = this.dbClient.collection(this.collections.validationCases)
      const completedCount = await validationCases.countDocuments({
        batchId: this.currentBatchId,
        status: this.validationStatus.COMPLETED
      })

      const totalCount = batch.caseCount || 0
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

      return {
        batchId: this.currentBatchId,
        status: batch.status,
        progress,
        caseCount: totalCount,
        completedCases: completedCount,
        reviewCount: batch.reviewCount || 0,
        createdAt: batch.createdAt
      }
    } catch (error) {
      this.logger.error('获取验证进度失败', error)
      throw error
    }
  }
}

module.exports = ClinicalValidationService
