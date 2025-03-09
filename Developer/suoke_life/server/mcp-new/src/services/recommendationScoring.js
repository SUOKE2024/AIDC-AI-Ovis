/**
 * @fileoverview 推荐评分服务，实现个性化推荐算法，用于增强推荐系统的精准度
 */

class RecommendationScoring {
  /**
   * 初始化推荐评分服务
   * @param {Object} tcmKnowledgeService - TCM知识服务实例
   * @param {Object} diagnosticService - 诊断服务实例
   */
  constructor (tcmKnowledgeService, diagnosticService) {
    this.tcmKnowledgeService = tcmKnowledgeService
    this.diagnosticService = diagnosticService

    // 因子权重配置
    this.weights = {
      constitutionMatch: 0.35, // 体质匹配权重
      seasonMatch: 0.20, // 季节匹配权重
      symptomMatch: 0.25, // 症状匹配权重
      userPreference: 0.15, // 用户偏好权重
      ageMatch: 0.05 // 年龄匹配权重
    }

    // 季节与节气映射
    this.seasonalTerms = {
      spring: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨'],
      summer: ['立夏', '小满', '芒种', '夏至', '小暑', '大暑'],
      autumn: ['立秋', '处暑', '白露', '秋分', '寒露', '霜降'],
      winter: ['立冬', '小雪', '大雪', '冬至', '小寒', '大寒']
    }
  }

  /**
   * 计算健康方案的匹配得分
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配得分(0-100)
   */
  scoreHealthPlan (plan, userProfile) {
    if (!plan || !userProfile) {
      return 0
    }

    let score = 0

    // 计算体质匹配分数
    const constitutionScore = this._calculateConstitutionScore(plan, userProfile)

    // 计算季节匹配分数
    const seasonScore = this._calculateSeasonScore(plan)

    // 计算症状匹配分数
    const symptomScore = this._calculateSymptomScore(plan, userProfile)

    // 计算用户偏好分数
    const preferenceScore = this._calculatePreferenceScore(plan, userProfile)

    // 计算年龄匹配分数
    const ageScore = this._calculateAgeScore(plan, userProfile)

    // 综合得分
    score = (
      constitutionScore * this.weights.constitutionMatch +
      seasonScore * this.weights.seasonMatch +
      symptomScore * this.weights.symptomMatch +
      preferenceScore * this.weights.userPreference +
      ageScore * this.weights.ageMatch
    )

    // 标准化分数到0-100
    return Math.min(Math.max(score * 100, 0), 100)
  }

  /**
   * 计算药膳推荐的匹配得分
   * @param {Object} recipe - 药膳方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配得分(0-100)
   */
  scoreMedicinalFoodRecipe (recipe, userProfile) {
    if (!recipe || !userProfile) {
      return 0
    }

    let score = 0

    // 计算体质匹配分数
    const constitutionScore = this._calculateRecipeConstitutionScore(recipe, userProfile)

    // 计算症状匹配分数
    const conditionScore = this._calculateRecipeConditionScore(recipe, userProfile)

    // 计算用户偏好和禁忌分数
    const preferenceScore = this._calculateRecipePreferenceScore(recipe, userProfile)

    // 综合得分 (药膳更注重体质匹配和症状匹配)
    score = (
      constitutionScore * 0.5 +
      conditionScore * 0.3 +
      preferenceScore * 0.2
    )

    // 标准化分数到0-100
    return Math.min(Math.max(score * 100, 0), 100)
  }

  /**
   * 基于用户最近诊断结果，为多个方案计算匹配度并排序
   * @param {Array} plans - 健康方案列表
   * @param {Object} userProfile - 用户健康档案
   * @returns {Array} 排序后的方案和评分
   */
  rankRecommendations (plans, userProfile) {
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      return []
    }

    const scoredPlans = plans.map(plan => {
      const score = this.scoreHealthPlan(plan, userProfile)
      return {
        plan,
        score,
        matchDetails: this._generateMatchDetails(plan, userProfile, score)
      }
    })

    // 按分数降序排序
    return scoredPlans.sort((a, b) => b.score - a.score)
  }

  /**
   * 计算体质匹配分数
   * @private
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateConstitutionScore (plan, userProfile) {
    if (!plan.conditions || !plan.conditions.diagnosis || !userProfile.constitution) {
      return 0
    }

    const planTypes = plan.conditions.diagnosis
    const userConstitution = userProfile.constitution

    // 主体质匹配度 (更高权重)
    let primaryMatch = 0
    if (userConstitution.primary && planTypes.includes(userConstitution.primary)) {
      primaryMatch = 1
    }

    // 次要体质匹配度
    let secondaryMatch = 0
    if (userConstitution.secondary && userConstitution.secondary.length > 0) {
      const matchCount = userConstitution.secondary.filter(type =>
        planTypes.includes(type)
      ).length

      secondaryMatch = matchCount / userConstitution.secondary.length
    }

    // 综合体质匹配度 (主体质占70%，次要体质占30%)
    return primaryMatch * 0.7 + secondaryMatch * 0.3
  }

  /**
   * 计算季节匹配分数
   * @private
   * @param {Object} plan - 健康方案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateSeasonScore (plan) {
    const currentDate = new Date()
    const month = currentDate.getMonth()

    // 确定当前季节
    let currentSeason
    if (month >= 2 && month <= 4) {
      currentSeason = 'spring'
    } else if (month >= 5 && month <= 7) {
      currentSeason = 'summer'
    } else if (month >= 8 && month <= 10) {
      currentSeason = 'autumn'
    } else {
      currentSeason = 'winter'
    }

    // 检查方案是否与当前季节相关
    if (plan.seasonality && plan.seasonality.includes(currentSeason)) {
      return 1
    }

    // 如果方案没有指定季节或与当前季节不匹配
    return plan.seasonality ? 0 : 0.5 // 无季节性的方案给予中等分数
  }

  /**
   * 计算症状匹配分数
   * @private
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateSymptomScore (plan, userProfile) {
    if (!plan.conditions || !plan.conditions.disharmonies || !userProfile.symptoms) {
      return 0
    }

    const planDisharmonies = plan.conditions.disharmonies
    const userSymptoms = userProfile.symptoms

    // 计算症状匹配程度
    let matchCount = 0
    userSymptoms.forEach(symptom => {
      const relatedDisharmonies = this._getRelatedDisharmonies(symptom)
      if (relatedDisharmonies.some(disharmony => planDisharmonies.includes(disharmony))) {
        matchCount++
      }
    })

    return userSymptoms.length > 0 ? matchCount / userSymptoms.length : 0
  }

  /**
   * 获取症状相关的失调类型
   * @private
   * @param {String} symptom - 症状
   * @returns {Array} 相关的失调类型
   */
  _getRelatedDisharmonies (symptom) {
    // 通过TCM知识服务查询症状相关的失调类型
    try {
      return this.tcmKnowledgeService.getRelatedPatterns(symptom) || []
    } catch (error) {
      console.error('获取症状相关失调类型失败:', error)
      return []
    }
  }

  /**
   * 计算用户偏好分数
   * @private
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculatePreferenceScore (plan, userProfile) {
    if (!userProfile.preferences) {
      return 0.5 // 无偏好数据时给予中等分数
    }

    const preferences = userProfile.preferences
    let score = 0.5 // 基础分数

    // 1. 检查用户喜好的调理方法是否包含在方案中
    if (preferences.methods && plan.recommendations) {
      const planMethods = []

      // 提取方案中的所有调理方法
      if (plan.recommendations.lifestyle) {
        planMethods.push(...plan.recommendations.lifestyle.map(r => r.content))
      }
      if (plan.recommendations.exercise) {
        planMethods.push(...plan.recommendations.exercise.map(r => r.content))
      }

      // 计算喜好方法的匹配程度
      const matchCount = preferences.methods.filter(method =>
        planMethods.some(planMethod => planMethod.includes(method))
      ).length

      if (preferences.methods.length > 0) {
        score += 0.2 * (matchCount / preferences.methods.length)
      }
    }

    // 2. 检查用户喜好的食物是否包含在方案中
    if (preferences.foods && plan.recommendations && plan.recommendations.diet) {
      const planFoods = plan.recommendations.diet.map(r => r.content)

      const matchCount = preferences.foods.filter(food =>
        planFoods.some(planFood => planFood.includes(food))
      ).length

      if (preferences.foods.length > 0) {
        score += 0.2 * (matchCount / preferences.foods.length)
      }
    }

    // 3. 检查用户喜好的药材是否包含在方案中
    if (preferences.herbs && plan.recommendations && plan.recommendations.herbs) {
      const planHerbs = plan.recommendations.herbs.map(r => r.content)

      const matchCount = preferences.herbs.filter(herb =>
        planHerbs.some(planHerb => planHerb.includes(herb))
      ).length

      if (preferences.herbs.length > 0) {
        score += 0.2 * (matchCount / preferences.herbs.length)
      }
    }

    // 确保分数在0-1范围内
    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * 计算年龄匹配分数
   * @private
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateAgeScore (plan, userProfile) {
    if (!userProfile.age || !plan.ageRange) {
      return 0.5 // 无年龄范围时给予中等分数
    }

    const age = userProfile.age
    const ageRange = plan.ageRange

    // 计算年龄匹配度
    if (age >= ageRange.min && age <= ageRange.max) {
      // 完全符合年龄范围
      return 1
    } else if (age < ageRange.min) {
      // 年龄小于最小值，计算接近程度
      const diff = ageRange.min - age
      return Math.max(0, 1 - diff / 10) // 每差10岁扣除满分
    } else {
      // 年龄大于最大值，计算接近程度
      const diff = age - ageRange.max
      return Math.max(0, 1 - diff / 10) // 每差10岁扣除满分
    }
  }

  /**
   * 计算药膳方案与用户体质的匹配度
   * @private
   * @param {Object} recipe - 药膳方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateRecipeConstitutionScore (recipe, userProfile) {
    if (!recipe.suitable_constitutions || !userProfile.constitution) {
      return 0
    }

    const suitableTypes = recipe.suitable_constitutions
    const userConstitution = userProfile.constitution

    // 主体质匹配
    let primaryMatch = 0
    if (userConstitution.primary && suitableTypes.includes(userConstitution.primary)) {
      primaryMatch = 1
    }

    // 次要体质匹配
    let secondaryMatch = 0
    if (userConstitution.secondary && userConstitution.secondary.length > 0) {
      const matchCount = userConstitution.secondary.filter(type =>
        suitableTypes.includes(type)
      ).length

      secondaryMatch = matchCount / userConstitution.secondary.length
    }

    // 检查禁忌
    let contraScore = 1
    if (recipe.contraindications) {
      if (recipe.contraindications.includes(userConstitution.primary)) {
        return 0 // 主体质禁忌，直接返回0分
      }

      if (userConstitution.secondary) {
        const contraCount = userConstitution.secondary.filter(type =>
          recipe.contraindications.includes(type)
        ).length

        if (contraCount > 0) {
          contraScore = Math.max(0, 1 - contraCount / userConstitution.secondary.length)
        }
      }
    }

    // 综合体质匹配度 (主体质占70%，次要体质占30%)
    const constitutionScore = primaryMatch * 0.7 + secondaryMatch * 0.3

    return constitutionScore * contraScore
  }

  /**
   * 计算药膳方案与用户症状的匹配度
   * @private
   * @param {Object} recipe - 药膳方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateRecipeConditionScore (recipe, userProfile) {
    if (!recipe.suitable_conditions || !userProfile.symptoms) {
      return 0
    }

    const conditions = recipe.suitable_conditions
    const userSymptoms = userProfile.symptoms

    // 计算症状匹配程度
    let matchCount = 0
    userSymptoms.forEach(symptom => {
      // 直接匹配或通过TCM知识服务推断关联
      if (conditions.some(condition =>
        condition.includes(symptom) || this._areRelated(condition, symptom))
      ) {
        matchCount++
      }
    })

    return userSymptoms.length > 0 ? matchCount / userSymptoms.length : 0
  }

  /**
   * 判断症状和适应证是否相关
   * @private
   * @param {String} condition - 适应证
   * @param {String} symptom - 症状
   * @returns {Boolean} 是否相关
   */
  _areRelated (condition, symptom) {
    try {
      const similarity = this.tcmKnowledgeService.calculateSymptomSimilarity(condition, symptom)
      return similarity > 0.6 // 相似度阈值
    } catch (error) {
      console.error('计算症状相似度失败:', error)
      return false
    }
  }

  /**
   * 计算药膳方案与用户偏好的匹配度
   * @private
   * @param {Object} recipe - 药膳方案
   * @param {Object} userProfile - 用户健康档案
   * @returns {Number} 匹配分数(0-1)
   */
  _calculateRecipePreferenceScore (recipe, userProfile) {
    if (!userProfile.preferences) {
      return 0.5 // 无偏好数据时给予中等分数
    }

    const preferences = userProfile.preferences
    let score = 0.5 // 基础分数

    // 检查用户喜好的食材是否包含在方案中
    if (preferences.foods && recipe.ingredients) {
      const matchCount = preferences.foods.filter(food =>
        recipe.ingredients.some(ingredient => ingredient.includes(food))
      ).length

      if (preferences.foods.length > 0) {
        score += 0.25 * (matchCount / preferences.foods.length)
      }
    }

    // 检查用户喜好的药材是否包含在方案中
    if (preferences.herbs && recipe.ingredients) {
      const matchCount = preferences.herbs.filter(herb =>
        recipe.ingredients.some(ingredient => ingredient.includes(herb))
      ).length

      if (preferences.herbs.length > 0) {
        score += 0.25 * (matchCount / preferences.herbs.length)
      }
    }

    // 确保分数在0-1范围内
    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * 生成匹配详情说明
   * @private
   * @param {Object} plan - 健康方案
   * @param {Object} userProfile - 用户健康档案
   * @param {Number} score - 总分
   * @returns {Object} 匹配详情
   */
  _generateMatchDetails (plan, userProfile, score) {
    const constitutionScore = this._calculateConstitutionScore(plan, userProfile) * 100
    const seasonScore = this._calculateSeasonScore(plan) * 100
    const symptomScore = this._calculateSymptomScore(plan, userProfile) * 100
    const preferenceScore = this._calculatePreferenceScore(plan, userProfile) * 100

    let matchStrength = '低'
    if (score > 80) {
      matchStrength = '极高'
    } else if (score > 60) {
      matchStrength = '高'
    } else if (score > 40) {
      matchStrength = '中'
    }

    const matchReason = []

    // 体质匹配
    if (constitutionScore > 70) {
      matchReason.push('非常适合您的体质')
    } else if (constitutionScore > 40) {
      matchReason.push('基本适合您的体质')
    }

    // 季节匹配
    if (seasonScore > 70) {
      matchReason.push('符合当前季节需要')
    }

    // 症状匹配
    if (symptomScore > 70) {
      matchReason.push('针对您的主要症状')
    } else if (symptomScore > 40) {
      matchReason.push('可缓解部分症状')
    }

    // 偏好匹配
    if (preferenceScore > 70) {
      matchReason.push('包含您喜欢的调理方式')
    }

    return {
      score,
      matchStrength,
      matchReason: matchReason.length > 0 ? matchReason : ['综合您的情况制定'],
      details: {
        constitutionScore: Math.round(constitutionScore),
        seasonScore: Math.round(seasonScore),
        symptomScore: Math.round(symptomScore),
        preferenceScore: Math.round(preferenceScore)
      }
    }
  }
}

module.exports = RecommendationScoring
