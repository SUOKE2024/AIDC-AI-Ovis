/**
 * 智能推荐服务
 * 提供基于诊断结果的健康方案、药食同源、个性化调理计划推荐
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')
const RecommendationScoring = require('./recommendationScoring')

/**
 * 推荐类型枚举
 */
const RecommendationType = {
  HEALTH_PLAN: 'health_plan', // 健康方案
  HERB_FOOD: 'herb_food', // 药食同源
  TREATMENT_PLAN: 'treatment_plan' // 调理计划
}

/**
 * 推荐优先级枚举
 */
const RecommendationPriority = {
  HIGH: 'high', // 高优先级
  MEDIUM: 'medium', // 中优先级
  LOW: 'low' // 低优先级
}

/**
 * 智能推荐服务类
 * 提供个性化健康推荐功能
 */
class RecommendationService {
  /**
   * 创建推荐服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {Object} options.tcmKnowledgeService - 中医知识库服务实例
   * @param {Object} options.vectorSearchService - 向量搜索服务实例
   * @param {Object} options.diagnosticService - 诊断服务实例
   * @param {Object} options.userHealthProfileService - 用户健康画像服务实例
   * @param {Object} options.adaptiveLearningService - 自适应学习服务实例
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'recommendation')
    this.plansDir = path.join(this.dataDir, 'plans')
    this.templatesDir = path.join(this.dataDir, 'templates')
    this.recipesDir = path.join(this.dataDir, 'recipes')

    this.tcmKnowledgeService = options.tcmKnowledgeService
    this.vectorSearchService = options.vectorSearchService
    this.diagnosticService = options.diagnosticService
    this.userHealthProfileService = options.userHealthProfileService
    this.adaptiveLearningService = options.adaptiveLearningService

    // 初始化推荐评分服务
    this.scoringService = new RecommendationScoring(
      this.tcmKnowledgeService,
      this.diagnosticService
    )

    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  _initService () {
    // 确保数据目录存在
    fs.ensureDirSync(this.dataDir)
    fs.ensureDirSync(this.plansDir)
    fs.ensureDirSync(this.templatesDir)
    fs.ensureDirSync(this.recipesDir)

    // 确保推荐类型目录存在
    Object.values(RecommendationType).forEach(type => {
      fs.ensureDirSync(path.join(this.plansDir, type))
      fs.ensureDirSync(path.join(this.templatesDir, type))
    })

    logger.info('推荐服务初始化完成')
  }

  /**
   * 生成健康方案
   * @param {Object} options - 选项
   * @param {Object} options.diagnosticResult - 诊断结果
   * @param {string} options.userId - 用户ID
   * @param {Object} options.preferences - 用户偏好
   * @param {Object} options.healthData - 用户健康数据
   * @param {Object} options.userProfile - 用户健康档案
   * @param {Object} options.adaptiveOptions - 自适应学习选项
   * @param {boolean} options.adaptiveOptions.useCollaborative - 是否使用协同过滤
   * @param {boolean} options.adaptiveOptions.useAdaptiveLearning - 是否使用自适应学习
   * @returns {Promise<Object>} 健康方案
   */
  async generateHealthPlan (options) {
    const {
      diagnosticResult,
      userId,
      preferences = {},
      healthData = {},
      userProfile = null,
      adaptiveOptions = {}
    } = options

    if (!diagnosticResult) {
      throw new Error('诊断结果不能为空')
    }

    logger.info('生成健康方案', { userId })

    try {
      // 生成方案ID和时间戳
      const planId = uuidv4()
      const timestamp = new Date().toISOString()

      // 根据诊断结果筛选推荐模板
      let templates = await this._getRecommendationTemplates(
        RecommendationType.HEALTH_PLAN,
        diagnosticResult.diagnosis || '',
        diagnosticResult.disharmonies || []
      )

      // 构建用户健康档案（如果未提供）
      const userHealthProfile = userProfile || await this._buildUserHealthProfile(
        userId,
        diagnosticResult,
        healthData,
        preferences
      )

      // 获取个性化权重
      let weights = null
      if (this.userHealthProfileService) {
        try {
          weights = await this.userHealthProfileService.generatePersonalizedWeights(userId)

          // 更新评分系统的权重
          if (weights) {
            this.scoringService.weights = weights
          }
        } catch (error) {
          logger.warn('获取个性化权重失败，使用默认权重', { userId, error: error.message })
        }
      }

      // 使用评分系统为模板评分并排序
      if (templates.length > 1 && userHealthProfile) {
        const scoredTemplates = this.scoringService.rankRecommendations(
          templates,
          userHealthProfile
        )

        // 选择排名靠前的模板（得分超过阈值的）
        templates = scoredTemplates
          .filter(item => item.score > 50) // 只选择得分大于50的模板
          .slice(0, 3) // 最多选择前3个
          .map(item => ({
            ...item.plan,
            matchScore: item.score,
            matchDetails: item.matchDetails
          }))

        // 记录评分结果
        logger.debug('健康方案模板评分结果', {
          userId,
          templateScores: scoredTemplates.map(t => ({ id: t.plan.id, score: t.score }))
        })
      }

      // 根据用户健康数据和偏好调整推荐内容
      const customizedTemplates = await this._customizeTemplates(
        templates,
        preferences,
        healthData
      )

      // 构建健康方案
      const healthPlan = {
        id: planId,
        userId: userId || 'anonymous',
        type: RecommendationType.HEALTH_PLAN,
        createdAt: timestamp,
        updatedAt: timestamp,
        sourceData: {
          diagnosticId: diagnosticResult.id,
          diagnosticType: diagnosticResult.type || 'unknown',
          diagnosis: diagnosticResult.diagnosis || 'unknown'
        },
        summary: this._generatePlanSummary(customizedTemplates, diagnosticResult),
        recommendations: {
          lifestyle: await this._generateLifestyleRecommendations(customizedTemplates, diagnosticResult, userHealthProfile),
          diet: await this._generateDietRecommendations(customizedTemplates, diagnosticResult, userHealthProfile),
          exercise: await this._generateExerciseRecommendations(customizedTemplates, diagnosticResult, userHealthProfile),
          herbs: await this._generateHerbRecommendations(customizedTemplates, diagnosticResult, userHealthProfile),
          preventions: await this._generatePreventionRecommendations(customizedTemplates, diagnosticResult, userHealthProfile)
        },
        schedule: await this._generateSchedule(customizedTemplates, diagnosticResult, userHealthProfile)
      }

      // 如果第一个模板有匹配分数和详情，添加到健康方案
      if (customizedTemplates.length > 0 && customizedTemplates[0].matchScore) {
        healthPlan.matchScore = customizedTemplates[0].matchScore
      }

      if (customizedTemplates.length > 0 && customizedTemplates[0].matchDetails) {
        healthPlan.matchDetails = customizedTemplates[0].matchDetails
      }

      // 应用协同过滤（如果启用）
      const { useCollaborative = true } = adaptiveOptions

      if (useCollaborative && this.adaptiveLearningService) {
        try {
          // 将健康方案转换为推荐项列表
          const recommendation = [{
            ...healthPlan,
            score: healthPlan.matchScore || 50 // 默认分数
          }]

          // 应用协同过滤
          const filteredRecommendations = await this.adaptiveLearningService.collaborativeFilterRecommendations(
            userId,
            recommendation,
            { useCollaborative }
          )

          // 如果有返回结果，更新分数
          if (filteredRecommendations.length > 0) {
            if (filteredRecommendations[0].collaborativeAdjustment) {
              healthPlan.collaborativeAdjustment = filteredRecommendations[0].collaborativeAdjustment
            }

            if (filteredRecommendations[0].score) {
              healthPlan.finalScore = filteredRecommendations[0].score
            }
          }
        } catch (error) {
          logger.warn('应用协同过滤失败', { userId, error: error.message })
        }
      }

      // 应用自适应学习（如果启用）
      const { useAdaptiveLearning = true } = adaptiveOptions

      if (useAdaptiveLearning && this.adaptiveLearningService) {
        try {
          // 将健康方案转换为推荐项列表
          const recommendation = [{
            ...healthPlan,
            score: healthPlan.finalScore || healthPlan.matchScore || 50 // 使用已有分数或默认分数
          }]

          // 应用自适应学习
          const adjustedRecommendations = await this.adaptiveLearningService.adaptiveAdjustRecommendations(
            userId,
            recommendation
          )

          // 如果有返回结果，更新分数和调整
          if (adjustedRecommendations.length > 0) {
            if (adjustedRecommendations[0].adaptiveAdjustments) {
              healthPlan.adaptiveAdjustments = adjustedRecommendations[0].adaptiveAdjustments
            }

            if (adjustedRecommendations[0].score) {
              healthPlan.finalScore = adjustedRecommendations[0].score
            }
          }
        } catch (error) {
          logger.warn('应用自适应学习失败', { userId, error: error.message })
        }
      }

      // 保存健康方案
      await this._savePlan(RecommendationType.HEALTH_PLAN, planId, healthPlan)

      return healthPlan
    } catch (error) {
      logger.error('生成健康方案失败', error)
      throw new Error(`生成健康方案失败: ${error.message}`)
    }
  }

  /**
   * 获取推荐模板
   * @private
   * @param {string} type - 推荐类型
   * @param {string} diagnosis - 诊断结果
   * @param {Array<string>} disharmonies - 不和谐模式列表
   * @returns {Promise<Array<Object>>} 推荐模板列表
   */
  async _getRecommendationTemplates (type, diagnosis, disharmonies) {
    try {
      const templatesDir = path.join(this.templatesDir, type)
      const templateFiles = await fs.readdir(templatesDir)

      const templates = []

      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const templatePath = path.join(templatesDir, file)
          const templateContent = await fs.readJson(templatePath)

          // 检查模板是否适用于当前诊断结果
          if (
            templateContent.conditions.diagnosis.includes(diagnosis) ||
            templateContent.conditions.disharmonies.some(d => disharmonies.includes(d))
          ) {
            templates.push(templateContent)
          }
        }
      }

      // 如果没有找到匹配的模板，返回默认模板
      if (templates.length === 0) {
        const defaultPath = path.join(templatesDir, 'default.json')
        if (await fs.pathExists(defaultPath)) {
          templates.push(await fs.readJson(defaultPath))
        } else {
          // 创建一个基本模板
          templates.push(this._createBasicTemplate(type, diagnosis))
        }
      }

      return templates
    } catch (error) {
      logger.error('获取推荐模板失败', error)
      // 返回基本模板
      return [this._createBasicTemplate(type, diagnosis)]
    }
  }

  /**
   * 创建基本模板
   * @private
   * @param {string} type - 推荐类型
   * @param {string} diagnosis - 诊断结果
   * @returns {Object} 基本模板
   */
  _createBasicTemplate (type, diagnosis) {
    return {
      id: 'basic-template',
      type,
      name: '基本推荐模板',
      description: '通用健康推荐',
      conditions: {
        diagnosis: [diagnosis],
        disharmonies: []
      },
      recommendations: {
        lifestyle: [
          { content: '保持规律作息，早睡早起', priority: RecommendationPriority.HIGH },
          { content: '避免过度疲劳，适当休息', priority: RecommendationPriority.MEDIUM },
          { content: '保持心情舒畅，避免情绪激动', priority: RecommendationPriority.MEDIUM }
        ],
        diet: [
          { content: '饮食均衡，荤素搭配', priority: RecommendationPriority.HIGH },
          { content: '少食多餐，定时定量', priority: RecommendationPriority.MEDIUM },
          { content: '少食辛辣刺激食物', priority: RecommendationPriority.MEDIUM }
        ],
        exercise: [
          { content: '适当进行有氧运动，如散步、慢跑', priority: RecommendationPriority.MEDIUM },
          { content: '练习太极、八段锦等传统养生功法', priority: RecommendationPriority.MEDIUM }
        ],
        herbs: [],
        preventions: [
          { content: '定期体检，及时了解身体状况', priority: RecommendationPriority.MEDIUM },
          { content: '保持良好的个人卫生习惯', priority: RecommendationPriority.MEDIUM }
        ]
      },
      schedule: {
        morning: ['早起适当活动', '清淡早餐'],
        noon: ['适度午休'],
        evening: ['轻松晚餐', '睡前放松活动'],
        weekly: ['定期总结健康状况']
      }
    }
  }

  /**
   * 根据用户偏好和健康数据定制模板
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} preferences - 用户偏好
   * @param {Object} healthData - 健康数据
   * @returns {Promise<Array<Object>>} 定制后的模板列表
   */
  async _customizeTemplates (templates, preferences, healthData) {
    // 复制模板以避免修改原始数据
    const customizedTemplates = JSON.parse(JSON.stringify(templates))

    for (const template of customizedTemplates) {
      // 根据用户饮食偏好调整饮食建议
      if (preferences.dietaryRestrictions) {
        template.recommendations.diet = template.recommendations.diet.filter(rec => {
          // 筛除与用户饮食限制相冲突的建议
          return !this._conflictsWithDietaryRestrictions(rec.content, preferences.dietaryRestrictions)
        })

        // 添加特定的饮食限制建议
        preferences.dietaryRestrictions.forEach(restriction => {
          template.recommendations.diet.push({
            content: `避免食用${restriction}`,
            priority: RecommendationPriority.HIGH,
            reason: '用户饮食限制'
          })
        })
      }

      // 根据用户运动偏好调整运动建议
      if (preferences.exercisePreferences) {
        // 提高用户喜欢的运动优先级
        template.recommendations.exercise.forEach(rec => {
          if (preferences.exercisePreferences.likes.some(e => rec.content.includes(e))) {
            rec.priority = RecommendationPriority.HIGH
            rec.reason = '用户偏好运动'
          }
        })

        // 添加用户喜欢的运动建议
        preferences.exercisePreferences.likes.forEach(exercise => {
          if (!template.recommendations.exercise.some(rec => rec.content.includes(exercise))) {
            template.recommendations.exercise.push({
              content: `坚持${exercise}活动`,
              priority: RecommendationPriority.HIGH,
              reason: '用户偏好运动'
            })
          }
        })
      }

      // 根据用户健康数据调整推荐
      if (healthData.conditions) {
        // 处理用户健康状况
        healthData.conditions.forEach(condition => {
          // 添加特定健康状况的建议
          this._addConditionSpecificRecommendations(template, condition)
        })
      }
    }

    return customizedTemplates
  }

  /**
   * 检查建议是否与用户饮食限制冲突
   * @private
   * @param {string} recommendation - 推荐内容
   * @param {Array<string>} restrictions - 用户饮食限制
   * @returns {boolean} 是否冲突
   */
  _conflictsWithDietaryRestrictions (recommendation, restrictions) {
    for (const restriction of restrictions) {
      // 如果推荐中包含鼓励食用用户限制的食物，则冲突
      if (recommendation.includes(`宜食${restriction}`) ||
          recommendation.includes(`多食${restriction}`) ||
          recommendation.includes(`可食用${restriction}`)) {
        return true
      }
    }
    return false
  }

  /**
   * 为特定健康状况添加推荐
   * @private
   * @param {Object} template - 推荐模板
   * @param {string} condition - 健康状况
   */
  _addConditionSpecificRecommendations (template, condition) {
    switch (condition.toLowerCase()) {
      case 'hypertension':
      case '高血压':
        template.recommendations.diet.push({
          content: '控制钠盐摄入，避免重口味食物',
          priority: RecommendationPriority.HIGH,
          reason: '高血压管理'
        })
        template.recommendations.lifestyle.push({
          content: '定期监测血压，保持记录',
          priority: RecommendationPriority.HIGH,
          reason: '高血压管理'
        })
        break
      case 'diabetes':
      case '糖尿病':
        template.recommendations.diet.push({
          content: '控制碳水化合物摄入，避免高糖食物',
          priority: RecommendationPriority.HIGH,
          reason: '糖尿病管理'
        })
        template.recommendations.lifestyle.push({
          content: '定期监测血糖，保持记录',
          priority: RecommendationPriority.HIGH,
          reason: '糖尿病管理'
        })
        break
      case 'insomnia':
      case '失眠':
        template.recommendations.lifestyle.push({
          content: '建立良好的睡眠习惯，固定作息时间',
          priority: RecommendationPriority.HIGH,
          reason: '改善睡眠'
        })
        template.recommendations.diet.push({
          content: '睡前避免咖啡因和重食',
          priority: RecommendationPriority.HIGH,
          reason: '改善睡眠'
        })
        break
      default:
        // 对于未专门处理的健康状况，添加一个通用建议
        template.recommendations.preventions.push({
          content: `关注${condition}状况，定期随访`,
          priority: RecommendationPriority.MEDIUM,
          reason: '健康管理'
        })
    }
  }

  /**
   * 生成药食同源推荐
   * @param {Object} options - 选项
   * @param {Object} options.diagnosticResult - 诊断结果
   * @param {string} options.userId - 用户ID
   * @param {Object} options.preferences - 用户偏好
   * @param {Array} options.existingHerbs - 已有药材
   * @param {Object} options.userProfile - 用户健康档案
   * @param {Object} options.adaptiveOptions - 自适应学习选项
   * @param {boolean} options.adaptiveOptions.useCollaborative - 是否使用协同过滤
   * @param {boolean} options.adaptiveOptions.useAdaptiveLearning - 是否使用自适应学习
   * @returns {Promise<Object>} 药食同源推荐
   */
  async generateHerbFoodRecommendation (options) {
    const {
      diagnosticResult,
      userId,
      preferences = {},
      existingHerbs = [],
      userProfile = null,
      adaptiveOptions = {}
    } = options

    if (!diagnosticResult) {
      throw new Error('诊断结果不能为空')
    }

    logger.info('生成药食同源推荐', { userId })

    try {
      // 生成推荐ID和时间戳
      const recommendationId = uuidv4()
      const timestamp = new Date().toISOString()

      // 构建用户健康档案（如果未提供）
      const userHealthProfile = userProfile || await this._buildUserHealthProfile(
        userId,
        diagnosticResult,
        {}, // 此处可以添加健康数据
        preferences
      )

      // 获取个性化权重
      let weights = null
      if (this.userHealthProfileService) {
        try {
          weights = await this.userHealthProfileService.generatePersonalizedWeights(userId)
        } catch (error) {
          logger.warn('获取个性化权重失败，使用默认权重', { userId, error: error.message })
        }
      }

      // 根据诊断结果获取药食关系知识
      const herbFoodKnowledge = await this._getHerbFoodKnowledge(
        diagnosticResult.diagnosis || '',
        diagnosticResult.disharmonies || []
      )

      // 获取药膳食疗方案
      const medicinalFoodRecipes = await this._getMedicinalFoodRecipes(diagnosticResult.diagnosis || '')

      // 使用评分系统为药膳方案评分排序
      let rankedRecipes = []
      if (medicinalFoodRecipes.length > 0 && userHealthProfile) {
        // 为每个食谱评分
        const scoredRecipes = medicinalFoodRecipes.map(recipe => {
          const score = this.scoringService.scoreMedicinalFoodRecipe(recipe, userHealthProfile)
          return { recipe, score }
        })

        // 排序并筛选高分食谱
        rankedRecipes = scoredRecipes
          .filter(item => item.score > 60) // 只选择得分大于60的食谱
          .sort((a, b) => b.score - a.score)
          .slice(0, 5) // 最多选择前5个
          .map(item => ({
            ...item.recipe,
            matchScore: item.score
          }))

        // 记录评分结果
        logger.debug('药膳食谱评分结果', {
          userId,
          recipeScores: scoredRecipes.map(r => ({ name: r.recipe.name, score: r.score }))
        })
      }

      // 生成食疗方案
      const dietTherapy = await this._generateDietTherapy(
        herbFoodKnowledge,
        diagnosticResult,
        preferences,
        existingHerbs,
        userHealthProfile
      )

      // 获取食谱推荐（结合评分后的药膳方案）
      const recipes = rankedRecipes.length > 0
        ? rankedRecipes
        : await this._getRecipeRecommendations(
          dietTherapy.ingredients,
          preferences,
          userHealthProfile
        )

      // 构建药食同源推荐
      const herbFoodRecommendation = {
        id: recommendationId,
        userId: userId || 'anonymous',
        type: RecommendationType.HERB_FOOD,
        createdAt: timestamp,
        updatedAt: timestamp,
        sourceData: {
          diagnosticId: diagnosticResult.id,
          diagnosticType: diagnosticResult.type || 'unknown',
          diagnosis: diagnosticResult.diagnosis || 'unknown'
        },
        summary: this._generateHerbFoodSummary(diagnosticResult, dietTherapy),
        principle: dietTherapy.principle,
        foods: {
          recommended: dietTherapy.ingredients.filter(i => i.recommendation === 'recommended'),
          neutral: dietTherapy.ingredients.filter(i => i.recommendation === 'neutral'),
          avoid: dietTherapy.ingredients.filter(i => i.recommendation === 'avoid')
        },
        mealPlan: dietTherapy.mealPlan,
        recipes,
        seasonalAdjustments: dietTherapy.seasonalAdjustments
      }

      // 应用协同过滤（如果启用）
      const { useCollaborative = true } = adaptiveOptions

      if (useCollaborative && this.adaptiveLearningService) {
        try {
          // 将健康方案转换为推荐项列表
          let maxRecipeScore = 0
          if (recipes.length > 0) {
            maxRecipeScore = Math.max(...recipes.map(r => r.matchScore || 0))
          }

          const recommendation = [{
            ...herbFoodRecommendation,
            score: maxRecipeScore || 50 // 默认分数
          }]

          // 应用协同过滤
          const filteredRecommendations = await this.adaptiveLearningService.collaborativeFilterRecommendations(
            userId,
            recommendation,
            { useCollaborative }
          )

          // 如果有返回结果，更新分数
          if (filteredRecommendations.length > 0) {
            if (filteredRecommendations[0].collaborativeAdjustment) {
              herbFoodRecommendation.collaborativeAdjustment = filteredRecommendations[0].collaborativeAdjustment
            }

            if (filteredRecommendations[0].score) {
              herbFoodRecommendation.finalScore = filteredRecommendations[0].score
            }
          }
        } catch (error) {
          logger.warn('应用协同过滤失败', { userId, error: error.message })
        }
      }

      // 应用自适应学习（如果启用）
      const { useAdaptiveLearning = true } = adaptiveOptions

      if (useAdaptiveLearning && this.adaptiveLearningService) {
        try {
          // 将药食同源推荐转换为推荐项列表
          const recommendation = [{
            ...herbFoodRecommendation,
            score: herbFoodRecommendation.finalScore || 50 // 使用已有分数或默认分数
          }]

          // 应用自适应学习
          const adjustedRecommendations = await this.adaptiveLearningService.adaptiveAdjustRecommendations(
            userId,
            recommendation
          )

          // 如果有返回结果，更新分数和调整
          if (adjustedRecommendations.length > 0) {
            if (adjustedRecommendations[0].adaptiveAdjustments) {
              herbFoodRecommendation.adaptiveAdjustments = adjustedRecommendations[0].adaptiveAdjustments
            }

            if (adjustedRecommendations[0].score) {
              herbFoodRecommendation.finalScore = adjustedRecommendations[0].score
            }
          }
        } catch (error) {
          logger.warn('应用自适应学习失败', { userId, error: error.message })
        }
      }

      // 保存推荐
      await this._savePlan(RecommendationType.HERB_FOOD, recommendationId, herbFoodRecommendation)

      return herbFoodRecommendation
    } catch (error) {
      logger.error('生成药食同源推荐失败', error)
      throw new Error(`生成药食同源推荐失败: ${error.message}`)
    }
  }

  /**
   * 获取药食关系知识
   * @private
   * @param {string} diagnosis - 诊断结果
   * @param {Array<string>} disharmonies - 不和谐模式列表
   * @returns {Promise<Object>} 药食关系知识
   */
  async _getHerbFoodKnowledge (diagnosis, disharmonies) {
    try {
      // 优先使用中医知识库服务
      if (this.tcmKnowledgeService) {
        // 查询与诊断结果相关的药材
        const herbs = await this.tcmKnowledgeService.searchKnowledge({
          category: 'herb',
          query: diagnosis,
          limit: 10
        })

        // 查询与不和谐模式相关的药材
        let disharmonyHerbs = []
        for (const disharmony of disharmonies) {
          const results = await this.tcmKnowledgeService.searchKnowledge({
            category: 'herb',
            query: disharmony,
            limit: 5
          })
          disharmonyHerbs = [...disharmonyHerbs, ...results]
        }

        // 合并并去重
        const allHerbs = [...herbs, ...disharmonyHerbs]
        const uniqueHerbs = this._uniqueByProperty(allHerbs, 'id')

        // 提取药食同源信息
        const herbFoodRelations = []
        for (const herb of uniqueHerbs) {
          if (herb.foodProperties) {
            herbFoodRelations.push({
              herb: herb.name,
              properties: herb.properties,
              foodRelations: herb.foodProperties,
              commonFoods: herb.commonFoods || []
            })
          }
        }

        return {
          herbs: uniqueHerbs,
          herbFoodRelations
        }
      }

      // 回退到本地药食关系数据
      const herbFoodPath = path.join(this.recipesDir, 'herb_food_relations.json')
      if (await fs.pathExists(herbFoodPath)) {
        const allRelations = await fs.readJson(herbFoodPath)

        // 过滤与诊断和不和谐模式相关的关系
        const relevantRelations = allRelations.filter(relation => {
          return relation.indications.some(indication =>
            indication.includes(diagnosis) || disharmonies.some(d => indication.includes(d))
          )
        })

        return {
          herbs: [],
          herbFoodRelations: relevantRelations
        }
      }

      // 如果没有数据，返回基本药食关系
      return this._getBasicHerbFoodRelations(diagnosis)
    } catch (error) {
      logger.error('获取药食关系知识失败', error)
      return this._getBasicHerbFoodRelations(diagnosis)
    }
  }

  /**
   * 生成食疗方案
   * @private
   * @param {Object} herbFoodKnowledge - 药食关系知识
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} preferences - 用户偏好
   * @param {Array<string>} existingHerbs - 已有药材列表
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Object>} 食疗方案
   */
  async _generateDietTherapy (herbFoodKnowledge, diagnosticResult, preferences, existingHerbs, userHealthProfile) {
    // 根据不同的诊断结果确定食疗原则
    let principle = ''
    const diagnosis = diagnosticResult.diagnosis || ''
    const disharmonies = diagnosticResult.disharmonies || []

    if (diagnosis.includes('脾胃虚寒') || disharmonies.includes('脾胃虚寒')) {
      principle = '温补脾胃，健脾益气'
    } else if (diagnosis.includes('湿热') || disharmonies.includes('湿热内蕴')) {
      principle = '清热祛湿，健脾利湿'
    } else if (diagnosis.includes('气血两虚') || disharmonies.includes('气血两虚')) {
      principle = '补气养血，健脾益肺'
    } else if (diagnosis.includes('肝火') || disharmonies.includes('肝火上炎')) {
      principle = '平肝降火，滋阴潜阳'
    } else if (diagnosis.includes('血瘀') || disharmonies.includes('血瘀证')) {
      principle = '活血化瘀，行气止痛'
    } else {
      principle = '调和阴阳，扶正固本'
    }

    // 选择合适的食材
    const suitableIngredients = []
    const avoidIngredients = []

    // 从药食关系中提取适宜食材
    for (const relation of herbFoodKnowledge.herbFoodRelations) {
      // 检查食材是否与原则相符
      if (this._isIngredientMatchingPrinciple(relation, principle)) {
        relation.commonFoods.forEach(food => {
          suitableIngredients.push({
            name: food,
            properties: relation.properties,
            herbRelation: relation.herb
          })
        })
      }
    }

    // 添加避免的食材
    if (principle.includes('温补')) {
      avoidIngredients.push('生冷食物', '寒性水果', '冰镇饮料')
    } else if (principle.includes('清热')) {
      avoidIngredients.push('辛辣刺激食物', '油炸食物', '酒类')
    } else if (principle.includes('补气养血')) {
      avoidIngredients.push('生冷食物', '不易消化食物')
    } else if (principle.includes('平肝降火')) {
      avoidIngredients.push('辛辣刺激食物', '油炸食物', '咖啡', '浓茶')
    }

    // 生成一周的膳食计划
    const mealPlans = this._generateWeeklyMealPlan(suitableIngredients, avoidIngredients, preferences)

    return {
      principle,
      ingredients: this._uniqueByProperty(suitableIngredients, 'name'),
      avoidIngredients: [...new Set(avoidIngredients)],
      mealPlans
    }
  }

  /**
   * 生成个性化调理计划
   * @param {Object} options - 选项
   * @param {Object} options.diagnosticResult - 诊断结果
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.preferences] - 用户偏好设置
   * @param {Object} [options.healthData] - 健康数据
   * @param {number} [options.durationWeeks=4] - 计划持续周数
   * @returns {Promise<Object>} 调理计划
   */
  async generateTreatmentPlan (options) {
    const { diagnosticResult, userId, preferences = {}, healthData = {}, durationWeeks = 4 } = options

    if (!diagnosticResult) {
      throw new Error('诊断结果不能为空')
    }

    logger.info('生成个性化调理计划', { userId, durationWeeks })

    try {
      // 生成计划ID和时间戳
      const planId = uuidv4()
      const timestamp = new Date().toISOString()

      // 获取健康方案
      const healthPlan = await this.generateHealthPlan({ diagnosticResult, userId, preferences, healthData })

      // 获取药食同源推荐
      const herbFoodRecommendation = await this.generateHerbFoodRecommendation({
        diagnosticResult,
        userId,
        preferences
      })

      // 构建阶段性调理计划
      const phases = this._generateTreatmentPhases(
        durationWeeks,
        diagnosticResult,
        healthPlan,
        herbFoodRecommendation
      )

      // 计划的开始和结束日期
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + durationWeeks * 7)

      // 构建调理计划
      const treatmentPlan = {
        id: planId,
        userId: userId || 'anonymous',
        type: RecommendationType.TREATMENT_PLAN,
        createdAt: timestamp,
        updatedAt: timestamp,
        sourceData: {
          diagnosticId: diagnosticResult.id,
          diagnosticType: diagnosticResult.type || 'unknown',
          diagnosis: diagnosticResult.diagnosis || 'unknown'
        },
        summary: this._generateTreatmentPlanSummary(diagnosticResult, phases),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationWeeks,
        phases,
        healthPlanId: healthPlan.id,
        herbFoodRecommendationId: herbFoodRecommendation.id,
        progressCheckpoints: this._generateProgressCheckpoints(durationWeeks),
        adjustmentGuidelines: this._generateAdjustmentGuidelines(diagnosticResult)
      }

      // 保存调理计划
      if (userId) {
        await this._savePlan(RecommendationType.TREATMENT_PLAN, planId, treatmentPlan)
      }

      return treatmentPlan
    } catch (error) {
      logger.error('生成调理计划失败', error)
      throw new Error(`生成调理计划失败: ${error.message}`)
    }
  }

  /**
   * 生成调理阶段
   * @private
   * @param {number} durationWeeks - 计划持续周数
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} healthPlan - 健康方案
   * @param {Object} herbFoodRecommendation - 药食同源推荐
   * @returns {Array<Object>} 调理阶段
   */
  _generateTreatmentPhases (durationWeeks, diagnosticResult, healthPlan, herbFoodRecommendation) {
    // 确定阶段数量
    const phaseCount = Math.min(3, Math.ceil(durationWeeks / 2))
    const phases = []

    // 调理原则（根据诊断调整）
    const principles = this._getTreatmentPrinciples(diagnosticResult)

    // 第一阶段：调理初期（1-2周）
    phases.push({
      id: 1,
      name: '调理初期',
      duration: Math.min(2, durationWeeks),
      principle: principles[0],
      focuses: [
        '消除主要症状',
        '建立健康习惯',
        '调整饮食结构'
      ],
      recommendations: {
        lifestyle: healthPlan.recommendations.lifestyle
          .filter(r => r.priority === RecommendationPriority.HIGH)
          .map(r => r.content),
        diet: herbFoodRecommendation.dietTherapy.ingredients
          .slice(0, 5)
          .map(i => `适量食用${i.name}`),
        medications: this._getPhaseSpecificMedications(1, diagnosticResult)
      },
      restrictions: herbFoodRecommendation.dietTherapy.avoidIngredients
    })

    // 如果计划持续超过2周，添加第二阶段
    if (durationWeeks > 2) {
      phases.push({
        id: 2,
        name: '调理中期',
        duration: Math.min(2, durationWeeks - 2),
        principle: principles[1] || principles[0],
        focuses: [
          '巩固调理效果',
          '增强体质',
          '调整运动强度'
        ],
        recommendations: {
          lifestyle: [...new Set([
            ...healthPlan.recommendations.lifestyle
              .filter(r => r.priority === RecommendationPriority.HIGH)
              .map(r => r.content),
            ...healthPlan.recommendations.exercise
              .filter(r => r.priority === RecommendationPriority.MEDIUM)
              .map(r => r.content)
          ])],
          diet: herbFoodRecommendation.dietTherapy.ingredients
            .slice(0, 7)
            .map(i => `适量食用${i.name}`),
          medications: this._getPhaseSpecificMedications(2, diagnosticResult)
        },
        restrictions: herbFoodRecommendation.dietTherapy.avoidIngredients
      })
    }

    // 如果计划持续超过4周，添加第三阶段
    if (durationWeeks > 4) {
      phases.push({
        id: 3,
        name: '调理后期',
        duration: durationWeeks - 4,
        principle: principles[2] || principles[0],
        focuses: [
          '维持健康状态',
          '预防复发',
          '形成长期健康习惯'
        ],
        recommendations: {
          lifestyle: [...new Set([
            ...healthPlan.recommendations.lifestyle
              .filter(r => r.priority !== RecommendationPriority.LOW)
              .map(r => r.content),
            ...healthPlan.recommendations.preventions
              .map(r => r.content)
          ])],
          diet: herbFoodRecommendation.dietTherapy.ingredients
            .map(i => `适量食用${i.name}`),
          medications: this._getPhaseSpecificMedications(3, diagnosticResult)
        },
        restrictions: herbFoodRecommendation.dietTherapy.avoidIngredients
      })
    }

    return phases
  }

  /**
   * 获取特定阶段的用药建议
   * @private
   * @param {number} phase - 阶段编号
   * @param {Object} diagnosticResult - 诊断结果
   * @returns {Array<string>} 用药建议
   */
  _getPhaseSpecificMedications (phase, diagnosticResult) {
    const diagnosis = diagnosticResult.diagnosis || ''
    const disharmonies = diagnosticResult.disharmonies || []
    const medications = []

    // 根据诊断选择方剂
    if (diagnosis.includes('脾胃虚寒') || disharmonies.includes('脾胃虚寒')) {
      if (phase === 1) {
        medications.push('理中丸：温中散寒，健脾益气')
      } else if (phase === 2) {
        medications.push('参苓白术散：健脾益气，补中养胃')
      } else {
        medications.push('四君子汤：补脾益气')
      }
    } else if (diagnosis.includes('湿热') || disharmonies.includes('湿热内蕴')) {
      if (phase === 1) {
        medications.push('三仁汤：清热利湿')
      } else if (phase === 2) {
        medications.push('清热利湿方：清热祛湿')
      } else {
        medications.push('甘露消毒丹：清热解毒')
      }
    } else if (diagnosis.includes('气血两虚') || disharmonies.includes('气血两虚')) {
      if (phase === 1) {
        medications.push('八珍汤：补气养血')
      } else if (phase === 2) {
        medications.push('归脾汤：健脾养血，益气安神')
      } else {
        medications.push('十全大补汤：补气养血，强身健体')
      }
    }

    // 如果没有特定方剂，提供通用建议
    if (medications.length === 0) {
      if (phase === 1) {
        medications.push('根据体质选择合适的汤剂，调整身体状态')
      } else if (phase === 2) {
        medications.push('选择温和的中药茶饮，持续调理体质')
      } else {
        medications.push('使用滋补类药膳，巩固调理效果')
      }
    }

    return medications
  }

  /**
   * 获取调理原则
   * @private
   * @param {Object} diagnosticResult - 诊断结果
   * @returns {Array<string>} 调理原则
   */
  _getTreatmentPrinciples (diagnosticResult) {
    const diagnosis = diagnosticResult.diagnosis || ''
    const disharmonies = diagnosticResult.disharmonies || []

    if (diagnosis.includes('脾胃虚寒') || disharmonies.includes('脾胃虚寒')) {
      return [
        '温补脾胃，健脾益气',
        '调和脾胃，温养中焦',
        '健脾温胃，巩固正气'
      ]
    } else if (diagnosis.includes('湿热') || disharmonies.includes('湿热内蕴')) {
      return [
        '清热祛湿，健脾利湿',
        '清热化湿，健运脾胃',
        '健脾祛湿，清热解毒'
      ]
    } else if (diagnosis.includes('气血两虚') || disharmonies.includes('气血两虚')) {
      return [
        '补气养血，健脾益肺',
        '健脾益气，养血安神',
        '补气养血，固本培元'
      ]
    } else if (diagnosis.includes('肝火') || disharmonies.includes('肝火上炎')) {
      return [
        '平肝降火，滋阴潜阳',
        '疏肝清热，调达肝气',
        '滋阴潜阳，养肝柔肝'
      ]
    } else if (diagnosis.includes('血瘀') || disharmonies.includes('血瘀证')) {
      return [
        '活血化瘀，行气止痛',
        '活血化瘀，调理气血',
        '活血养血，通络止痛'
      ]
    } else {
      return [
        '调和阴阳，扶正固本',
        '调补气血，平衡阴阳',
        '固本培元，增强体质'
      ]
    }
  }

  /**
   * 生成健康方案摘要
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @returns {string} 方案摘要
   */
  _generatePlanSummary (templates, diagnosticResult) {
    const diagnosis = diagnosticResult.diagnosis || '综合健康问题'
    const disharmonies = diagnosticResult.disharmonies || []

    let summary = `针对${diagnosis}`
    if (disharmonies.length > 0) {
      summary += `（${disharmonies.join('、')}）`
    }

    summary += '的健康方案，重点关注'

    // 根据推荐内容确定重点
    const focuses = []
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosis)

    if (template.recommendations.lifestyle.some(r => r.priority === RecommendationPriority.HIGH)) {
      focuses.push('生活方式调整')
    }

    if (template.recommendations.diet.some(r => r.priority === RecommendationPriority.HIGH)) {
      focuses.push('饮食调理')
    }

    if (template.recommendations.exercise.some(r => r.priority === RecommendationPriority.HIGH)) {
      focuses.push('适当运动')
    }

    if (template.recommendations.herbs.length > 0) {
      focuses.push('中药调养')
    }

    if (focuses.length === 0) {
      focuses.push('综合健康管理')
    }

    summary += focuses.join('、') + '。'

    return summary
  }

  /**
   * 生成生活方式建议
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 生活方式建议
   */
  async _generateLifestyleRecommendations (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')
    return template.recommendations.lifestyle
  }

  /**
   * 生成饮食建议
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 饮食建议
   */
  async _generateDietRecommendations (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')
    return template.recommendations.diet
  }

  /**
   * 生成运动建议
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 运动建议
   */
  async _generateExerciseRecommendations (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')
    return template.recommendations.exercise
  }

  /**
   * 生成草药建议
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 草药建议
   */
  async _generateHerbRecommendations (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')

    // 如果模板中没有草药建议，根据诊断结果添加
    if (template.recommendations.herbs.length === 0 && this.tcmKnowledgeService) {
      try {
        const diagnosis = diagnosticResult.diagnosis || ''
        const disharmonies = diagnosticResult.disharmonies || []

        // 查询相关方剂
        const formulas = await this.tcmKnowledgeService.searchKnowledge({
          category: 'formula',
          query: diagnosis,
          limit: 3
        })

        if (formulas.length > 0) {
          return formulas.map(formula => ({
            content: `${formula.name}：${formula.functions}`,
            priority: RecommendationPriority.MEDIUM
          }))
        }
      } catch (error) {
        logger.error('生成草药建议失败', error)
      }
    }

    return template.recommendations.herbs
  }

  /**
   * 生成预防建议
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 预防建议
   */
  async _generatePreventionRecommendations (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')
    return template.recommendations.preventions
  }

  /**
   * 生成日程安排
   * @private
   * @param {Array<Object>} templates - 推荐模板列表
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Object>} 日程安排
   */
  async _generateSchedule (templates, diagnosticResult, userHealthProfile) {
    const template = templates[0] || this._createBasicTemplate(RecommendationType.HEALTH_PLAN, diagnosticResult.diagnosis || '')
    return template.schedule
  }

  /**
   * 生成药食同源摘要
   * @private
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} dietTherapy - 食疗方案
   * @returns {string} 摘要
   */
  _generateHerbFoodSummary (diagnosticResult, dietTherapy) {
    const diagnosis = diagnosticResult.diagnosis || '综合健康问题'

    let summary = `针对${diagnosis}的药食同源推荐，`
    summary += `基本原则为"${dietTherapy.principle}"。`

    if (dietTherapy.ingredients.length > 0) {
      const topIngredients = dietTherapy.ingredients.slice(0, 3).map(i => i.name).join('、')
      summary += `推荐食材包括${topIngredients}等`

      if (dietTherapy.ingredients.length > 3) {
        summary += `共${dietTherapy.ingredients.length}种食材`
      }
      summary += '。'
    }

    if (dietTherapy.avoidIngredients.length > 0) {
      summary += `建议避免${dietTherapy.avoidIngredients.join('、')}。`
    }

    return summary
  }

  /**
   * 检查食材是否符合原则
   * @private
   * @param {Object} relation - 药食关系
   * @param {string} principle - 食疗原则
   * @returns {boolean} 是否符合
   */
  _isIngredientMatchingPrinciple (relation, principle) {
    if (!relation.properties) {
      return false
    }

    // 根据不同原则判断食材属性是否匹配
    if (principle.includes('温补')) {
      return relation.properties.includes('温') ||
             relation.properties.includes('热') ||
             relation.properties.includes('补')
    } else if (principle.includes('清热')) {
      return relation.properties.includes('寒') ||
             relation.properties.includes('凉') ||
             relation.properties.includes('清热')
    } else if (principle.includes('补气养血')) {
      return relation.properties.includes('补气') ||
             relation.properties.includes('养血') ||
             relation.properties.includes('补血')
    } else if (principle.includes('平肝降火')) {
      return relation.properties.includes('平肝') ||
             relation.properties.includes('清热') ||
             relation.properties.includes('凉')
    } else if (principle.includes('活血化瘀')) {
      return relation.properties.includes('活血') ||
             relation.properties.includes('化瘀') ||
             relation.properties.includes('行气')
    } else {
      // 默认匹配
      return true
    }
  }

  /**
   * 生成周膳食计划
   * @private
   * @param {Array<Object>} ingredients - 食材列表
   * @param {Array<string>} avoidIngredients - 避免的食材列表
   * @param {Object} preferences - 用户偏好
   * @returns {Array<Object>} 周膳食计划
   */
  _generateWeeklyMealPlan (ingredients, avoidIngredients, preferences) {
    // 为一周7天生成膳食计划
    const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
    const mealTypes = ['早餐', '午餐', '晚餐']

    // 随机选择食材
    const getRandomIngredients = (count) => {
      const shuffled = [...ingredients].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, Math.min(count, ingredients.length))
    }

    const weeklyPlan = {}

    weekdays.forEach(day => {
      const dayPlan = {}

      mealTypes.forEach(mealType => {
        // 为每餐选择2-4种食材
        const mealIngredients = getRandomIngredients(2 + Math.floor(Math.random() * 3))

        dayPlan[mealType] = {
          ingredients: mealIngredients.map(i => i.name),
          suggestion: this._generateMealSuggestion(mealType, mealIngredients, avoidIngredients)
        }
      })

      weeklyPlan[day] = dayPlan
    })

    return weeklyPlan
  }

  /**
   * 生成餐食建议
   * @private
   * @param {string} mealType - 餐食类型
   * @param {Array<Object>} ingredients - 食材列表
   * @param {Array<string>} avoidIngredients - 避免的食材
   * @returns {string} 餐食建议
   */
  _generateMealSuggestion (mealType, ingredients, avoidIngredients) {
    const ingredientNames = ingredients.map(i => i.name)

    if (mealType === '早餐') {
      return `${ingredientNames.join('、')}为主的营养早餐，避免${avoidIngredients[0] || '油腻食物'}`
    } else if (mealType === '午餐') {
      return `以${ingredientNames.join('、')}等食材制作的均衡午餐，注意细嚼慢咽`
    } else {
      return `晚餐宜清淡，可选用${ingredientNames.join('、')}等食材，避免${avoidIngredients[0] || '辛辣刺激'}食物`
    }
  }

  /**
   * 生成季节性调整
   * @private
   * @param {Array<Object>} ingredients - 食材列表
   * @returns {Object} 季节性调整
   */
  _generateSeasonalAdjustments (ingredients) {
    return {
      spring: {
        focus: '疏肝解郁，调养阳气',
        recommendedIngredients: ingredients
          .filter((_, index) => index % 4 === 0)
          .map(i => i.name),
        adjustments: ['增加疏肝解郁食材', '适当减少酸味食物', '增加温和食材摄入']
      },
      summer: {
        focus: '清热祛湿，健脾消暑',
        recommendedIngredients: ingredients
          .filter((_, index) => index % 4 === 1)
          .map(i => i.name),
        adjustments: ['增加清热祛湿食材', '适量食用苦味食物', '注意防暑降温']
      },
      autumn: {
        focus: '润肺清燥，健脾养胃',
        recommendedIngredients: ingredients
          .filter((_, index) => index % 4 === 2)
          .map(i => i.name),
        adjustments: ['增加润肺食材', '适当增加酸甘食物', '避免过于辛辣']
      },
      winter: {
        focus: '温补阳气，滋养肾精',
        recommendedIngredients: ingredients
          .filter((_, index) => index % 4 === 3)
          .map(i => i.name),
        adjustments: ['增加温补食材', '适当增加咸味食物', '注意保暖']
      }
    }
  }

  /**
   * 获取食谱推荐
   * @private
   * @param {Array<Object>} ingredients - 推荐食材
   * @param {Object} preferences - 用户偏好
   * @param {Object} userHealthProfile - 用户健康档案
   * @returns {Promise<Array<Object>>} 推荐食谱
   */
  async _getRecipeRecommendations (ingredients, preferences, userHealthProfile) {
    // 从食谱目录加载食谱
    try {
      // 1. 从季节性食谱文件中获取当前季节的食谱
      const seasonalRecipesPath = path.join(this.recipesDir, 'seasonal_recipes.json')
      let seasonalRecipes = []

      if (fs.existsSync(seasonalRecipesPath)) {
        try {
          const seasonalData = await fs.readJson(seasonalRecipesPath)

          // 获取当前节气
          const currentSolarTerm = this._getCurrentSolarTerm()

          // 从季节性食谱中筛选当前节气的食谱
          if (seasonalData && seasonalData.recipes && Array.isArray(seasonalData.recipes)) {
            const currentTermRecipes = seasonalData.recipes.find(
              item => item.solar_term === currentSolarTerm
            )

            if (currentTermRecipes && currentTermRecipes.recipes) {
              seasonalRecipes = currentTermRecipes.recipes
            } else {
              // 如果没有匹配当前节气的食谱，获取当前季节的食谱
              const currentSeason = this._getCurrentSeason()
              const currentSeasonRecipes = seasonalData.recipes.filter(
                item => item.season === currentSeason
              )

              if (currentSeasonRecipes.length > 0) {
                // 合并当前季节的所有食谱
                seasonalRecipes = currentSeasonRecipes.reduce(
                  (acc, curr) => acc.concat(curr.recipes || []),
                  []
                )
              }
            }
          }
        } catch (error) {
          logger.error('解析季节性食谱文件失败', { error: error.message })
        }
      }

      // 2. 从其他食谱文件中获取通用食谱
      const recipeFiles = await fs.readdir(this.recipesDir)
      const recipes = []

      for (const file of recipeFiles) {
        if (file.endsWith('.json') &&
            file !== 'herb_food_relations.json' &&
            file !== 'seasonal_recipes.json' &&
            file !== 'medicinal_food_recipes.json') {
          const recipePath = path.join(this.recipesDir, file)
          const recipeData = await fs.readJson(recipePath)

          if (recipeData.recipes && Array.isArray(recipeData.recipes)) {
            recipes.push(...recipeData.recipes)
          } else if (recipeData.name && recipeData.ingredients) {
            // 单个食谱
            recipes.push(recipeData)
          }
        }
      }

      // 3. 合并所有食谱并根据匹配度评分
      const allRecipes = [...seasonalRecipes, ...recipes]

      // 为食谱评分
      const scoredRecipes = allRecipes.map(recipe => {
        // 基本分数
        let score = 0

        // 检查食谱是否使用了推荐的食材
        const matchingIngredients = recipe.ingredients.filter(ingredient =>
          ingredients.some(i => ingredient.toLowerCase().includes(i.name.toLowerCase()))
        )

        // 按匹配食材数量评分 (30%)
        score += (matchingIngredients.length / recipe.ingredients.length) * 30

        // 季节性匹配 (20%)
        if (seasonalRecipes.includes(recipe)) {
          score += 20
        }

        // 用户偏好匹配 (20%)
        if (preferences.preferredFoods && Array.isArray(preferences.preferredFoods)) {
          const preferredMatch = preferences.preferredFoods.filter(food =>
            recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(food.toLowerCase()))
          ).length

          if (preferences.preferredFoods.length > 0) {
            score += (preferredMatch / preferences.preferredFoods.length) * 20
          }
        }

        // 考虑用户健康档案 (30%)
        if (userHealthProfile) {
          // 体质匹配
          if (recipe.suitable_constitutions && userHealthProfile.constitution) {
            const constitutionMatch = recipe.suitable_constitutions.includes(
              userHealthProfile.constitution.primary
            )

            if (constitutionMatch) {
              score += 15
            } else if (userHealthProfile.constitution.secondary) {
              // 检查次要体质匹配
              const secondaryMatch = userHealthProfile.constitution.secondary.some(
                type => recipe.suitable_constitutions.includes(type)
              )

              if (secondaryMatch) {
                score += 10
              }
            }
          }

          // 禁忌检查
          if (recipe.contraindications && userHealthProfile.constitution) {
            if (recipe.contraindications.includes(userHealthProfile.constitution.primary)) {
              score = 0 // 主体质禁忌，直接设为0分
            }
          }

          // 症状匹配
          if (recipe.suitable_conditions && userHealthProfile.symptoms) {
            const symptomMatch = userHealthProfile.symptoms.some(symptom =>
              recipe.suitable_conditions.some(condition => condition.includes(symptom))
            )

            if (symptomMatch) {
              score += 15
            }
          }
        }

        return { recipe, score }
      })

      // 按分数排序并返回前5个
      return scoredRecipes
        .filter(item => item.score > 0) // 过滤掉禁忌的食谱
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) // 返回前5个最匹配的食谱
        .map(item => item.recipe)
    } catch (error) {
      logger.error('获取食谱推荐失败', { error: error.message })
      return []
    }
  }

  /**
   * 获取当前季节
   * @private
   * @returns {string} 当前季节 ('春', '夏', '秋', '冬')
   */
  _getCurrentSeason () {
    const month = new Date().getMonth() + 1 // getMonth() 返回 0-11

    if (month >= 3 && month <= 5) {
      return '春'
    } else if (month >= 6 && month <= 8) {
      return '夏'
    } else if (month >= 9 && month <= 11) {
      return '秋'
    } else {
      return '冬'
    }
  }

  /**
   * 获取当前节气（简化版）
   * @private
   * @returns {string} 当前节气
   */
  _getCurrentSolarTerm () {
    // 简化版本，仅基于月份和日期粗略估计
    // 未来可以实现更精确的计算
    const date = new Date()
    const month = date.getMonth() + 1 // getMonth() 返回 0-11
    const day = date.getDate()

    // 简化的节气映射表
    const solarTerms = {
      1: [{ day: 5, term: '小寒' }, { day: 20, term: '大寒' }],
      2: [{ day: 4, term: '立春' }, { day: 19, term: '雨水' }],
      3: [{ day: 5, term: '惊蛰' }, { day: 20, term: '春分' }],
      4: [{ day: 5, term: '清明' }, { day: 20, term: '谷雨' }],
      5: [{ day: 5, term: '立夏' }, { day: 21, term: '小满' }],
      6: [{ day: 6, term: '芒种' }, { day: 21, term: '夏至' }],
      7: [{ day: 7, term: '小暑' }, { day: 22, term: '大暑' }],
      8: [{ day: 7, term: '立秋' }, { day: 23, term: '处暑' }],
      9: [{ day: 8, term: '白露' }, { day: 23, term: '秋分' }],
      10: [{ day: 8, term: '寒露' }, { day: 23, term: '霜降' }],
      11: [{ day: 7, term: '立冬' }, { day: 22, term: '小雪' }],
      12: [{ day: 7, term: '大雪' }, { day: 22, term: '冬至' }]
    }

    const monthTerms = solarTerms[month] || []

    // 查找当前月份中对应的节气
    for (let i = monthTerms.length - 1; i >= 0; i--) {
      if (day >= monthTerms[i].day) {
        return monthTerms[i].term
      }
    }

    // 如果当前日期小于本月第一个节气的日期，使用上个月的最后一个节气
    const prevMonth = month === 1 ? 12 : month - 1
    const prevMonthTerms = solarTerms[prevMonth] || []

    return prevMonthTerms.length > 0 ? prevMonthTerms[prevMonthTerms.length - 1].term : '冬至'
  }

  /**
   * 根据属性去重
   * @private
   * @param {Array<Object>} array - 对象数组
   * @param {string} prop - 属性名
   * @returns {Array<Object>} 去重后的数组
   */
  _uniqueByProperty (array, prop) {
    const seen = new Set()
    return array.filter(item => {
      const value = item[prop]
      if (!seen.has(value)) {
        seen.add(value)
        return true
      }
      return false
    })
  }

  /**
   * 获取基本药食关系
   * @private
   * @param {string} diagnosis - 诊断结果
   * @returns {Object} 基本药食关系
   */
  _getBasicHerbFoodRelations (diagnosis) {
    // 根据诊断结果返回一些基本的药食关系
    const basicRelations = []

    if (diagnosis.includes('脾胃虚寒')) {
      basicRelations.push({
        herb: '干姜',
        properties: '温、热、辛',
        indications: ['脾胃虚寒', '寒凝腹痛'],
        commonFoods: ['生姜', '胡椒', '肉桂']
      })
    } else if (diagnosis.includes('湿热')) {
      basicRelations.push({
        herb: '薏苡仁',
        properties: '凉、甘、淡',
        indications: ['湿热内蕴', '水肿'],
        commonFoods: ['薏米', '赤小豆', '冬瓜']
      })
    } else if (diagnosis.includes('气血两虚')) {
      basicRelations.push({
        herb: '党参',
        properties: '平、甘',
        indications: ['气血两虚', '脾胃虚弱'],
        commonFoods: ['山药', '大枣', '鸡肉']
      })
    } else if (diagnosis.includes('肝火')) {
      basicRelations.push({
        herb: '菊花',
        properties: '凉、甘、苦',
        indications: ['肝火上炎', '目赤肿痛'],
        commonFoods: ['菊花茶', '绿茶', '苦瓜']
      })
    } else if (diagnosis.includes('血瘀')) {
      basicRelations.push({
        herb: '丹参',
        properties: '凉、苦',
        indications: ['血瘀证', '胸痹心痛'],
        commonFoods: ['红枣', '桃仁', '红花']
      })
    } else {
      basicRelations.push({
        herb: '黄芪',
        properties: '温、甘',
        indications: ['气虚', '表虚自汗'],
        commonFoods: ['山药', '大枣', '鸡肉']
      })
    }

    return {
      herbs: [],
      herbFoodRelations: basicRelations
    }
  }

  /**
   * 生成调理计划摘要
   * @private
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Array<Object>} phases - 调理阶段
   * @returns {string} 计划摘要
   */
  _generateTreatmentPlanSummary (diagnosticResult, phases) {
    const diagnosis = diagnosticResult.diagnosis || '综合健康问题'
    const phaseCount = phases.length

    let summary = `针对${diagnosis}的`
    summary += `${phaseCount}阶段调理计划，总周期为${phases.reduce((total, phase) => total + phase.duration, 0)}周。`

    // 添加各阶段主要原则
    summary += '调理过程将'
    phases.forEach((phase, index) => {
      if (index > 0) {
        summary += index === phases.length - 1 ? '，最后' : '，然后'
      }
      summary += `${phase.principle}`
    })

    summary += '，逐步恢复健康状态。'

    return summary
  }

  /**
   * 生成进度检查点
   * @private
   * @param {number} durationWeeks - 计划持续周数
   * @returns {Array<Object>} 进度检查点
   */
  _generateProgressCheckpoints (durationWeeks) {
    const checkpoints = []

    // 根据计划长度确定检查点
    if (durationWeeks <= 2) {
      // 短期计划：每周一次
      for (let week = 1; week <= durationWeeks; week++) {
        checkpoints.push({
          week,
          description: `第${week}周检查`,
          focusAreas: ['症状变化', '生活习惯改变'],
          adjustmentNeeded: week === durationWeeks
        })
      }
    } else if (durationWeeks <= 4) {
      // 中期计划：第1、2、4周
      [1, 2, durationWeeks].forEach(week => {
        checkpoints.push({
          week,
          description: `第${week}周检查`,
          focusAreas: ['症状变化', '生活习惯改变', week >= 2 ? '体质变化' : ''],
          adjustmentNeeded: week === durationWeeks || week === 2
        })
      })
    } else {
      // 长期计划：第1、2、4周和最后一周
      [1, 2, 4, durationWeeks].forEach(week => {
        checkpoints.push({
          week,
          description: `第${week}周检查`,
          focusAreas: [
            '症状变化',
            '生活习惯改变',
            week >= 2 ? '体质变化' : '',
            week >= 4 ? '长期效果评估' : ''
          ].filter(Boolean),
          adjustmentNeeded: week === 2 || week === 4
        })
      })
    }

    return checkpoints
  }

  /**
   * 生成调整指南
   * @private
   * @param {Object} diagnosticResult - 诊断结果
   * @returns {Object} 调整指南
   */
  _generateAdjustmentGuidelines (diagnosticResult) {
    return {
      symptomsImproved: [
        '可以适当增加活动强度',
        '继续保持当前调理方案',
        '增加一些滋补类食材'
      ],
      symptomsUnchanged: [
        '增加调理频率',
        '检查是否正确执行调理方案',
        '考虑调整用药或食疗重点'
      ],
      symptomsWorsened: [
        '立即减轻运动强度',
        '回归基础调理方案',
        '考虑重新进行诊断分析',
        '必要时寻求专业医疗帮助'
      ]
    }
  }

  /**
   * 保存推荐计划
   * @private
   * @param {string} type - 推荐类型
   * @param {string} id - 推荐ID
   * @param {Object} data - 推荐数据
   * @returns {Promise<void>}
   */
  async _savePlan (type, id, data) {
    const typeDir = path.join(this.plansDir, type)
    const filePath = path.join(typeDir, `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
  }

  /**
   * 获取用户推荐计划
   * @param {Object} options - 查询选项
   * @param {string} options.userId - 用户ID
   * @param {string} [options.type] - 推荐类型
   * @param {number} [options.limit=10] - 结果数量限制
   * @returns {Promise<Array>} 推荐计划列表
   */
  async getUserPlans (options) {
    const { userId, type, limit = 10 } = options

    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      let results = []

      if (type && Object.values(RecommendationType).includes(type)) {
        // 如果指定了类型，只获取该类型的计划
        const typeDir = path.join(this.plansDir, type)
        results = await this._loadUserTypePlans(typeDir, userId)
      } else {
        // 否则获取所有类型的计划
        for (const planType of Object.values(RecommendationType)) {
          const typeDir = path.join(this.plansDir, planType)

          if (await fs.pathExists(typeDir)) {
            const typePlans = await this._loadUserTypePlans(typeDir, userId)
            results = results.concat(typePlans)
          }
        }
      }

      // 按时间倒序排序
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // 限制结果数量
      if (limit > 0) {
        results = results.slice(0, limit)
      }

      return results
    } catch (error) {
      logger.error('获取用户推荐计划失败', error)
      throw new Error(`获取用户推荐计划失败: ${error.message}`)
    }
  }

  /**
   * 根据ID获取推荐计划
   * @param {string} planId - 计划ID
   * @returns {Promise<Object>} 推荐计划
   */
  async getPlanById (planId) {
    try {
      // 在所有类型目录中查找
      for (const type of Object.values(RecommendationType)) {
        const filePath = path.join(this.plansDir, type, `${planId}.json`)

        if (await fs.pathExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf8')
          return JSON.parse(content)
        }
      }

      return null
    } catch (error) {
      logger.error(`获取推荐计划失败: ${planId}`, error)
      throw new Error(`获取推荐计划失败: ${error.message}`)
    }
  }

  /**
   * 加载用户特定类型的推荐计划
   * @private
   * @param {string} typeDir - 类型目录
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 计划列表
   */
  async _loadUserTypePlans (typeDir, userId) {
    try {
      const files = await fs.readdir(typeDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const plans = []

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(typeDir, file)
          const content = await fs.readFile(filePath, 'utf8')
          const data = JSON.parse(content)

          if (data.userId === userId) {
            plans.push(data)
          }
        } catch (error) {
          logger.error(`加载推荐计划文件失败: ${file}`, error)
        }
      }

      return plans
    } catch (error) {
      logger.error(`加载用户推荐计划失败: ${typeDir}, ${userId}`, error)
      return []
    }
  }

  /**
   * 构建用户健康档案
   * @private
   * @param {string} userId - 用户ID
   * @param {Object} diagnosticResult - 诊断结果
   * @param {Object} healthData - 健康数据
   * @param {Object} preferences - 用户偏好
   * @returns {Promise<Object>} 用户健康档案
   */
  async _buildUserHealthProfile (userId, diagnosticResult, healthData, preferences) {
    // 默认健康档案
    const profile = {
      userId,
      // 提取体质信息
      constitution: {
        primary: diagnosticResult.diagnosis || '基本健康',
        secondary: diagnosticResult.secondaryDiagnosis || []
      },
      // 提取症状
      symptoms: diagnosticResult.symptoms || [],
      // 用户偏好
      preferences: {
        foods: preferences.preferredFoods || [],
        herbs: preferences.preferredHerbs || [],
        methods: preferences.preferredMethods || []
      }
    }

    // 提取年龄信息
    if (healthData.age) {
      profile.age = healthData.age
    } else if (healthData.birthDate) {
      // 计算年龄
      const birthDate = new Date(healthData.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDifference = today.getMonth() - birthDate.getMonth()
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      profile.age = age
    }

    // 提取性别信息
    if (healthData.gender) {
      profile.gender = healthData.gender
    }

    // 提取健康指标
    profile.healthMetrics = {}
    if (healthData.weight) {
      profile.healthMetrics.weight = healthData.weight
    }
    if (healthData.height) {
      profile.healthMetrics.height = healthData.height
    }
    if (healthData.bloodPressure) {
      profile.healthMetrics.bloodPressure = healthData.bloodPressure
    }
    if (healthData.bloodSugar) {
      profile.healthMetrics.bloodSugar = healthData.bloodSugar
    }

    // 提取不适症状
    if (diagnosticResult.disharmonies && diagnosticResult.disharmonies.length > 0) {
      profile.disharmonies = diagnosticResult.disharmonies
    }

    // 提取或计算体质失衡严重程度
    if (diagnosticResult.severity) {
      profile.severity = diagnosticResult.severity
    } else if (diagnosticResult.metrics && diagnosticResult.metrics.constitutionScore) {
      // 根据体质评分计算严重程度
      const score = diagnosticResult.metrics.constitutionScore
      if (score > 80) {
        profile.severity = 'severe'
      } else if (score > 50) {
        profile.severity = 'moderate'
      } else {
        profile.severity = 'mild'
      }
    }

    // 添加用户历史健康记录摘要（如果有）
    try {
      const healthHistory = await this._getUserHealthHistory(userId)
      if (healthHistory && healthHistory.length > 0) {
        // 提取最近的健康趋势
        profile.healthTrends = this._extractHealthTrends(healthHistory)
      }
    } catch (error) {
      logger.warn('获取用户健康历史记录失败', { userId, error: error.message })
    }

    return profile
  }

  /**
   * 获取用户健康历史记录
   * @private
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 健康历史记录
   */
  async _getUserHealthHistory (userId) {
    // 这里应该实现从数据库获取用户历史健康记录的逻辑
    // 当前返回空数组，未来可以扩展此功能
    return []
  }

  /**
   * 从健康历史记录中提取健康趋势
   * @private
   * @param {Array} healthHistory - 健康历史记录
   * @returns {Object} 健康趋势
   */
  _extractHealthTrends (healthHistory) {
    // 示例实现，未来可以扩展
    return {
      improving: [],
      worsening: [],
      stable: []
    }
  }

  /**
   * 获取药膳食疗方案
   * @private
   * @param {string} diagnosis - 诊断结果
   * @returns {Promise<Array>} 药膳食谱列表
   */
  async _getMedicinalFoodRecipes (diagnosis) {
    try {
      // 从药膳食疗方案数据文件中读取
      const medicinalFoodPath = path.join(this.recipesDir, 'medicinal_food_recipes.json')

      // 检查文件是否存在
      if (!fs.existsSync(medicinalFoodPath)) {
        logger.warn('药膳食疗方案文件不存在', { path: medicinalFoodPath })
        return []
      }

      // 读取文件内容
      const medicinalFoodData = await fs.readJson(medicinalFoodPath)

      if (!medicinalFoodData || !medicinalFoodData.recipes || !Array.isArray(medicinalFoodData.recipes)) {
        logger.warn('药膳食疗方案数据格式不正确')
        return []
      }

      // 根据诊断结果查找匹配的体质类型
      const constitutionType = this._normalizeConstitutionType(diagnosis)

      // 找到匹配的体质类型的药膳方案
      const matchingConstitution = medicinalFoodData.recipes.find(
        item => this._normalizeConstitutionType(item.constitution_type) === constitutionType
      )

      // 如果找到匹配的体质类型，返回其药膳食谱
      if (matchingConstitution && matchingConstitution.recipes && Array.isArray(matchingConstitution.recipes)) {
        return matchingConstitution.recipes
      }

      // 如果没有匹配的体质类型，尝试返回通用药膳食谱
      const generalRecipes = medicinalFoodData.recipes.find(
        item => item.constitution_type === '基本健康' || item.constitution_type === 'general'
      )

      if (generalRecipes && generalRecipes.recipes && Array.isArray(generalRecipes.recipes)) {
        return generalRecipes.recipes
      }

      // 如果未找到任何食谱，返回空数组
      return []
    } catch (error) {
      logger.error('获取药膳食疗方案失败', { error: error.message })
      return []
    }
  }

  /**
   * 标准化体质类型名称
   * @private
   * @param {string} constitutionType - 体质类型
   * @returns {string} 标准化的体质类型名称
   */
  _normalizeConstitutionType (constitutionType) {
    if (!constitutionType) return 'general'

    // 移除可能的额外空格
    const normalizedType = constitutionType.trim()

    // 常见别名映射
    const typeMap = {
      阴虚: '阴虚体质',
      阳虚: '阳虚体质',
      气虚: '气虚体质',
      痰湿: '痰湿体质',
      湿热: '湿热体质',
      血瘀: '血瘀体质',
      气郁: '气郁体质',
      特禀: '特禀体质',
      平和: '平和体质',
      基本健康: '平和体质'
    }

    return typeMap[normalizedType] || normalizedType
  }
}

// 导出推荐服务
module.exports = {
  RecommendationType,
  RecommendationPriority,
  RecommendationService
}
