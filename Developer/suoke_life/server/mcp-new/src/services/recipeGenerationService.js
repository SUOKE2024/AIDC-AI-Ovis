/**
 * @fileoverview 食谱智能生成服务，结合TCM知识库、用户健康画像和季节因素生成个性化药膳配方
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')

/**
 * 食谱生成服务类
 */
class RecipeGenerationService {
  /**
   * 创建食谱生成服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {Object} options.tcmKnowledgeService - 中医知识库服务实例
   * @param {Object} options.userHealthProfileService - 用户健康画像服务实例
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'recommendation')
    this.knowledgeDir = path.join(this.dataDir, 'knowledge')
    this.recipesDir = path.join(this.dataDir, 'recipes')
    this.generatedRecipesDir = path.join(this.dataDir, 'generated_recipes')

    this.tcmKnowledgeService = options.tcmKnowledgeService
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
      await fs.ensureDir(this.knowledgeDir)
      await fs.ensureDir(this.recipesDir)
      await fs.ensureDir(this.generatedRecipesDir)

      // 加载知识库
      await this._loadKnowledgeBases()

      logger.info('食谱智能生成服务初始化完成')
    } catch (error) {
      logger.error('食谱智能生成服务初始化失败', error)
    }
  }

  /**
   * 加载知识库
   * @private
   */
  async _loadKnowledgeBases () {
    try {
      // 加载食材性味功效数据库
      const foodPropertyPath = path.join(this.knowledgeDir, 'food_property_database.json')
      if (await fs.pathExists(foodPropertyPath)) {
        this.foodPropertyDB = await fs.readJson(foodPropertyPath)
      }

      // 加载药食同源关系数据库
      const herbFoodPath = path.join(this.knowledgeDir, 'herb_food_relations.json')
      if (await fs.pathExists(herbFoodPath)) {
        this.herbFoodDB = await fs.readJson(herbFoodPath)
      }

      // 加载体质食材适宜性数据库
      const constitutionFoodPath = path.join(this.knowledgeDir, 'constitution_food_compatibility.json')
      if (await fs.pathExists(constitutionFoodPath)) {
        this.constitutionFoodDB = await fs.readJson(constitutionFoodPath)
      }

      // 加载节气食材数据库
      const seasonalTermPath = path.join(this.knowledgeDir, 'seasonal_term_foods.json')
      if (await fs.pathExists(seasonalTermPath)) {
        this.seasonalTermDB = await fs.readJson(seasonalTermPath)
      }
    } catch (error) {
      logger.error('加载知识库失败', error)
      throw new Error('加载知识库失败: ' + error.message)
    }
  }

  /**
   * 生成个性化药膳食谱
   * @param {Object} options - 选项
   * @param {string} options.userId - 用户ID
   * @param {string} options.constitutionType - 体质类型
   * @param {Array} options.symptoms - 症状列表
   * @param {string} options.season - 季节
   * @param {string} options.solarTerm - 节气
   * @param {Array} options.dietaryPreferences - 饮食偏好
   * @param {Array} options.dietaryRestrictions - 饮食限制
   * @returns {Promise<Object>} 生成的食谱
   */
  async generatePersonalizedRecipe (options) {
    const {
      userId,
      constitutionType,
      symptoms = [],
      season = this._getCurrentSeason(),
      solarTerm = this._getCurrentSolarTerm(),
      dietaryPreferences = [],
      dietaryRestrictions = []
    } = options

    logger.info('生成个性化药膳食谱', { userId, constitutionType, season, solarTerm })

    try {
      // 获取用户健康画像
      let userProfile = null
      if (userId && this.userHealthProfileService) {
        userProfile = await this.userHealthProfileService.getUserHealthProfile(userId)
      }

      // 确定主体质
      const mainConstitution = constitutionType ||
        (userProfile && userProfile.constitution && userProfile.constitution.primary) ||
        '平和体质'

      // 1. 根据体质获取适宜食材
      const suitableFoods = await this._getSuitableFoodsByConstitution(mainConstitution)

      // 2. 根据季节和节气调整食材
      const seasonalFoods = await this._getSeasonalFoods(season, solarTerm)

      // 3. 根据症状选择具有针对性的食材
      const therapeuticFoods = await this._getTherapeuticFoods(symptoms)

      // 4. 合并食材列表并按适宜度排序
      const rankedIngredients = this._rankIngredients(
        suitableFoods,
        seasonalFoods,
        therapeuticFoods,
        dietaryPreferences,
        dietaryRestrictions
      )

      // 5. 选择药膳方式（汤、粥、炖品等）
      const cookingMethod = this._selectCookingMethod(mainConstitution, season)

      // 6. 生成食谱
      const recipe = this._constructRecipe(
        rankedIngredients,
        cookingMethod,
        mainConstitution,
        season,
        solarTerm,
        symptoms
      )

      // 7. 保存生成的食谱
      const recipeId = uuidv4()
      recipe.id = recipeId
      recipe.createdAt = new Date().toISOString()
      recipe.userId = userId

      await this._saveGeneratedRecipe(recipeId, recipe)

      return recipe
    } catch (error) {
      logger.error('生成个性化药膳食谱失败', { userId, error: error.message })
      throw new Error(`生成个性化药膳食谱失败: ${error.message}`)
    }
  }

  /**
   * 根据体质获取适宜食材
   * @private
   * @param {string} constitutionType - 体质类型
   * @returns {Promise<Array>} 适宜食材列表
   */
  async _getSuitableFoodsByConstitution (constitutionType) {
    // 标准化体质名称
    const normalizedType = this._normalizeConstitutionType(constitutionType)

    // 初始化适宜食材列表
    const suitableFoods = []

    // 从体质食材适宜性数据库获取
    if (this.constitutionFoodDB && this.constitutionFoodDB.constitutions) {
      const constitution = this.constitutionFoodDB.constitutions.find(c =>
        c.name === normalizedType
      )

      if (constitution && constitution.suitable_foods) {
        constitution.suitable_foods.forEach(category => {
          category.foods.forEach(food => {
            suitableFoods.push({
              name: food,
              category: category.category,
              suitability: 'high',
              reason: category.reason,
              source: 'constitution_db'
            })
          })
        })
      }
    }

    // 从食材性味功效数据库获取
    if (this.foodPropertyDB && this.foodPropertyDB.foods) {
      this.foodPropertyDB.foods.forEach(food => {
        const isSuitable = food.suitable_conditions &&
          food.suitable_conditions.some(condition => {
            return condition.includes(constitutionType) ||
              this._isConditionMatchConstitution(condition, constitutionType)
          })

        const isContraindicated = food.contraindications &&
          food.contraindications.some(contraindication => {
            return contraindication.includes(constitutionType) ||
              this._isConditionMatchConstitution(contraindication, constitutionType)
          })

        if (isSuitable && !isContraindicated) {
          // 检查是否已经添加
          const existingIndex = suitableFoods.findIndex(f => f.name === food.name)
          if (existingIndex >= 0) {
            // 如果已经存在，提高适宜度
            suitableFoods[existingIndex].suitability = 'very_high'
          } else {
            suitableFoods.push({
              name: food.name,
              category: food.category,
              suitability: 'high',
              nature: food.nature,
              flavor: food.flavor,
              functions: food.functions,
              source: 'food_property_db'
            })
          }
        }
      })
    }

    // 从药食同源关系数据库获取
    if (this.herbFoodDB && this.herbFoodDB.herb_food_relations) {
      this.herbFoodDB.herb_food_relations.forEach(relation => {
        const isSuitable = relation.suitable_constitutions &&
          relation.suitable_constitutions.some(constitution => {
            return constitution === normalizedType ||
              constitution.includes(normalizedType.replace('体质', ''))
          })

        const isContraindicated = relation.contraindicated_constitutions &&
          relation.contraindicated_constitutions.some(constitution => {
            return constitution === normalizedType ||
              constitution.includes(normalizedType.replace('体质', ''))
          })

        if (isSuitable && !isContraindicated) {
          relation.food_equivalents.forEach(foodEquivalent => {
            // 检查是否已经添加
            const existingIndex = suitableFoods.findIndex(f => f.name === foodEquivalent.name)
            if (existingIndex >= 0) {
              // 如果已经存在，提高适宜度
              suitableFoods[existingIndex].suitability = 'very_high'
            } else {
              suitableFoods.push({
                name: foodEquivalent.name,
                relatedHerb: relation.herb.name,
                suitability: 'high',
                similarity: foodEquivalent.similarity,
                combinedEffect: foodEquivalent.combined_effect,
                recipeExample: foodEquivalent.recipe_example,
                source: 'herb_food_db'
              })
            }
          })
        }
      })
    }

    return suitableFoods
  }

  /**
   * 根据季节和节气获取适宜食材
   * @private
   * @param {string} season - 季节
   * @param {string} solarTerm - 节气
   * @returns {Promise<Array>} 时令食材列表
   */
  async _getSeasonalFoods (season, solarTerm) {
    const seasonalFoods = []

    // 从节气食材数据库获取
    if (this.seasonalTermDB && this.seasonalTermDB.solar_terms) {
      // 查找特定节气的食材
      const termData = this.seasonalTermDB.solar_terms.find(term =>
        term.name === solarTerm
      )

      if (termData && termData.suitable_foods) {
        termData.suitable_foods.forEach(category => {
          category.foods.forEach(food => {
            seasonalFoods.push({
              name: food,
              category: category.category,
              suitability: 'high',
              reason: category.reason,
              solarTerm,
              source: 'seasonal_term_db'
            })
          })
        })
      } else {
        // 如果找不到特定节气，查找同季节的所有节气
        const sameSeasonTerms = this.seasonalTermDB.solar_terms.filter(term =>
          term.season === season
        )

        sameSeasonTerms.forEach(term => {
          if (term.suitable_foods) {
            term.suitable_foods.forEach(category => {
              category.foods.forEach(food => {
                // 检查是否已经添加
                const existingIndex = seasonalFoods.findIndex(f => f.name === food)
                if (existingIndex === -1) {
                  seasonalFoods.push({
                    name: food,
                    category: category.category,
                    suitability: 'medium',
                    reason: category.reason,
                    solarTerm: term.name,
                    source: 'seasonal_term_db'
                  })
                }
              })
            })
          }
        })
      }
    }

    // 从食材性味功效数据库获取季节性食材
    if (this.foodPropertyDB && this.foodPropertyDB.foods) {
      this.foodPropertyDB.foods.forEach(food => {
        if (food.seasonal_availability && food.seasonal_availability.includes(season)) {
          // 检查是否已经添加
          const existingIndex = seasonalFoods.findIndex(f => f.name === food.name)
          if (existingIndex >= 0) {
            // 如果已经存在，提高适宜度
            seasonalFoods[existingIndex].suitability = 'high'
          } else {
            seasonalFoods.push({
              name: food.name,
              category: food.category,
              suitability: 'medium',
              seasonal_availability: food.seasonal_availability,
              source: 'food_property_db'
            })
          }
        }
      })
    }

    return seasonalFoods
  }

  /**
   * 根据症状获取有治疗作用的食材
   * @private
   * @param {Array} symptoms - 症状列表
   * @returns {Promise<Array>} 有治疗作用的食材列表
   */
  async _getTherapeuticFoods (symptoms) {
    const therapeuticFoods = []

    if (!symptoms || symptoms.length === 0) {
      return therapeuticFoods
    }

    // 从食材性味功效数据库获取
    if (this.foodPropertyDB && this.foodPropertyDB.foods) {
      this.foodPropertyDB.foods.forEach(food => {
        const relevantSymptoms = []

        symptoms.forEach(symptom => {
          const isRelevant = food.suitable_conditions &&
            food.suitable_conditions.some(condition =>
              condition.includes(symptom) || this._isSymptomRelatedToCondition(symptom, condition)
            )

          if (isRelevant) {
            relevantSymptoms.push(symptom)
          }
        })

        if (relevantSymptoms.length > 0) {
          therapeuticFoods.push({
            name: food.name,
            category: food.category,
            suitability: relevantSymptoms.length / symptoms.length >= 0.5 ? 'high' : 'medium',
            relevantSymptoms,
            functions: food.functions,
            source: 'food_property_db'
          })
        }
      })
    }

    // 从药食同源关系数据库获取
    if (this.herbFoodDB && this.herbFoodDB.herb_food_relations) {
      // 对于每个症状，找出适合的药材
      symptoms.forEach(symptom => {
        this.herbFoodDB.herb_food_relations.forEach(relation => {
          const isRelevant = relation.herb.functions &&
            relation.herb.functions.some(func =>
              this._isFunctionRelevantToSymptom(func, symptom)
            )

          if (isRelevant) {
            relation.food_equivalents.forEach(foodEquivalent => {
              // 检查是否已经添加
              const existingIndex = therapeuticFoods.findIndex(f => f.name === foodEquivalent.name)
              if (existingIndex >= 0) {
                // 如果已经存在，提高适宜度并添加相关症状
                therapeuticFoods[existingIndex].suitability = 'high'
                if (!therapeuticFoods[existingIndex].relevantSymptoms.includes(symptom)) {
                  therapeuticFoods[existingIndex].relevantSymptoms.push(symptom)
                }
              } else {
                therapeuticFoods.push({
                  name: foodEquivalent.name,
                  relatedHerb: relation.herb.name,
                  suitability: 'medium',
                  relevantSymptoms: [symptom],
                  herbFunctions: relation.herb.functions,
                  combinedEffect: foodEquivalent.combined_effect,
                  source: 'herb_food_db'
                })
              }
            })
          }
        })
      })
    }

    return therapeuticFoods
  }

  /**
   * 合并并排序食材
   * @private
   * @param {Array} constitutionFoods - 体质适宜食材
   * @param {Array} seasonalFoods - 时令食材
   * @param {Array} therapeuticFoods - 治疗作用食材
   * @param {Array} preferences - 饮食偏好
   * @param {Array} restrictions - 饮食限制
   * @returns {Array} 排序后的食材列表
   */
  _rankIngredients (constitutionFoods, seasonalFoods, therapeuticFoods, preferences, restrictions) {
    // 合并所有食材
    const allIngredients = new Map()

    // 添加食材到Map，并计算初始分数
    const addIngredientsToMap = (ingredients, baseScore) => {
      ingredients.forEach(ingredient => {
        // 跳过限制的食材
        if (restrictions && restrictions.includes(ingredient.name)) {
          return
        }

        let score = baseScore

        // 根据适宜度调整分数
        if (ingredient.suitability === 'very_high') score += 30
        else if (ingredient.suitability === 'high') score += 20
        else if (ingredient.suitability === 'medium') score += 10

        // 对偏好食材加分
        if (preferences && preferences.includes(ingredient.name)) {
          score += 15
        }

        if (allIngredients.has(ingredient.name)) {
          // 如果已存在，增加分数
          const existing = allIngredients.get(ingredient.name)
          existing.score += score

          // 合并来源和原因
          existing.sources = existing.sources || []
          existing.sources.push(ingredient.source)

          // 合并相关症状
          if (ingredient.relevantSymptoms) {
            existing.relevantSymptoms = existing.relevantSymptoms || []
            ingredient.relevantSymptoms.forEach(symptom => {
              if (!existing.relevantSymptoms.includes(symptom)) {
                existing.relevantSymptoms.push(symptom)
              }
            })
          }

          allIngredients.set(ingredient.name, existing)
        } else {
          // 添加新食材
          ingredient.score = score
          ingredient.sources = [ingredient.source]
          allIngredients.set(ingredient.name, ingredient)
        }
      })
    }

    // 按来源重要性添加食材
    addIngredientsToMap(therapeuticFoods, 50) // 治疗作用最重要
    addIngredientsToMap(constitutionFoods, 40) // 体质适宜次之
    addIngredientsToMap(seasonalFoods, 30) // 时令食材再次

    // 转换Map为数组并排序
    const rankedIngredients = Array.from(allIngredients.values())
      .sort((a, b) => b.score - a.score)

    return rankedIngredients
  }

  /**
   * 选择烹饪方式
   * @private
   * @param {string} constitutionType - 体质类型
   * @param {string} season - 季节
   * @returns {string} 烹饪方式
   */
  _selectCookingMethod (constitutionType, season) {
    // 默认烹饪方式
    const defaultMethod = '煮'

    // 根据体质选择烹饪方式
    switch (constitutionType) {
      case '阳虚体质':
        return season === '冬' ? '炖' : '煮'
      case '阴虚体质':
        return season === '夏' ? '煮' : '炖'
      case '气虚体质':
        return '炖'
      case '痰湿体质':
        return '煮'
      case '湿热体质':
        return '清炒'
      case '血瘀体质':
        return '炖'
      case '气郁体质':
        return '清炒'
      case '特禀体质':
        return '蒸'
      case '平和体质':
      default:
        return season === '夏' ? '清炒' : (season === '冬' ? '炖' : '煮')
    }
  }

  /**
   * 构建食谱
   * @private
   * @param {Array} rankedIngredients - 排序后的食材
   * @param {string} cookingMethod - 烹饪方式
   * @param {string} constitutionType - 体质类型
   * @param {string} season - 季节
   * @param {string} solarTerm - 节气
   * @param {Array} symptoms - 症状列表
   * @returns {Object} 食谱
   */
  _constructRecipe (rankedIngredients, cookingMethod, constitutionType, season, solarTerm, symptoms) {
    // 确定食谱名称
    const topIngredients = rankedIngredients.slice(0, 3)
    const mainIngredient = topIngredients[0] ? topIngredients[0].name : '食材'
    const secondaryIngredient = topIngredients[1] ? topIngredients[1].name : ''

    let recipeName = ''
    if (secondaryIngredient) {
      recipeName = `${cookingMethod}${mainIngredient}${secondaryIngredient}`
    } else {
      recipeName = `${cookingMethod}${mainIngredient}`
    }

    // 确定食谱类型
    let recipeType = ''
    switch (cookingMethod) {
      case '炖':
        recipeType = '汤类'
        break
      case '煮':
        recipeType = '粥类'
        break
      case '蒸':
        recipeType = '蒸品'
        break
      case '清炒':
        recipeType = '素炒'
        break
      default:
        recipeType = '混合'
    }

    // 选择主料（分数最高的2-3个）
    const mainIngredients = rankedIngredients.slice(0, 3).map(ing => ing.name)

    // 选择辅料（分数中等的3-5个）
    const supplementaryIngredients = rankedIngredients.slice(3, 8).map(ing => ing.name)

    // 选择调料（根据体质和季节）
    const seasonings = this._getSeasonings(constitutionType, season)

    // 生成烹饪步骤
    const cookingSteps = this._generateCookingSteps(
      mainIngredients,
      supplementaryIngredients,
      seasonings,
      cookingMethod,
      recipeType
    )

    // 确定食谱功效
    const recipeEffects = this._determineRecipeEffects(
      rankedIngredients.slice(0, 5),
      constitutionType,
      symptoms
    )

    // 构建完整食谱
    return {
      name: recipeName,
      type: recipeType,
      constitutionType,
      season,
      solarTerm,
      ingredients: {
        main: mainIngredients.map(name => ({ name, amount: '适量' })),
        supplementary: supplementaryIngredients.map(name => ({ name, amount: '适量' })),
        seasonings: seasonings.map(name => ({ name, amount: '适量' }))
      },
      cookingMethod,
      cookingSteps,
      effects: recipeEffects,
      nutritionalValue: this._estimateNutritionalValue(rankedIngredients.slice(0, 8)),
      suitablePopulation: [constitutionType],
      contraindications: this._getContraindications(rankedIngredients.slice(0, 5))
    }
  }

  /**
   * 获取适当的调料
   * @private
   * @param {string} constitutionType - 体质类型
   * @param {string} season - 季节
   * @returns {Array} 调料列表
   */
  _getSeasonings (constitutionType, season) {
    // 基础调料
    const commonSeasonings = ['盐', '葱', '姜']

    // 根据体质调整调料
    switch (constitutionType) {
      case '阳虚体质':
        return [...commonSeasonings, '桂皮', '干姜', '八角']
      case '阴虚体质':
        return [...commonSeasonings, '薄荷', '冰糖']
      case '气虚体质':
        return [...commonSeasonings, '黄芪', '大枣']
      case '痰湿体质':
        return [...commonSeasonings, '陈皮', '胡椒']
      case '湿热体质':
        return [...commonSeasonings, '薄荷', '绿茶']
      case '血瘀体质':
        return [...commonSeasonings, '醋', '红花']
      case '气郁体质':
        return [...commonSeasonings, '柴胡', '香菜']
      case '特禀体质':
        return [...commonSeasonings] // 减少调料使用
      case '平和体质':
      default:
        // 根据季节调整
        if (season === '夏') {
          return [...commonSeasonings, '薄荷', '冰糖']
        } else if (season === '冬') {
          return [...commonSeasonings, '桂皮', '八角']
        } else {
          return [...commonSeasonings, '香菜']
        }
    }
  }

  /**
   * 生成烹饪步骤
   * @private
   * @param {Array} mainIngredients - 主料
   * @param {Array} supplementaryIngredients - 辅料
   * @param {Array} seasonings - 调料
   * @param {string} cookingMethod - 烹饪方式
   * @param {string} recipeType - 食谱类型
   * @returns {Array} 烹饪步骤
   */
  _generateCookingSteps (mainIngredients, supplementaryIngredients, seasonings, cookingMethod, recipeType) {
    const steps = []

    // 步骤1：准备食材
    steps.push(`1. 准备食材：${[...mainIngredients, ...supplementaryIngredients].join('、')}洗净备用。`)

    // 步骤2：处理主料
    if (recipeType === '粥类') {
      steps.push(`2. 将${mainIngredients.join('、')}洗净后加入锅中，加水适量。`)
    } else if (recipeType === '汤类') {
      steps.push(`2. 将${mainIngredients.join('、')}洗净切块，加入锅中，加水适量。`)
    } else if (recipeType === '蒸品') {
      steps.push(`2. 将${mainIngredients.join('、')}洗净切片，放入盘中。`)
    } else {
      steps.push(`2. 将${mainIngredients.join('、')}洗净切片备用。`)
    }

    // 步骤3：处理辅料和调料
    if (supplementaryIngredients.length > 0) {
      if (recipeType === '素炒') {
        steps.push(`3. 锅中加油，爆香${seasonings.filter(s => ['姜', '葱', '蒜'].includes(s)).join('、')}，加入${supplementaryIngredients.join('、')}翻炒。`)
      } else {
        steps.push(`3. 将${supplementaryIngredients.join('、')}洗净处理后备用。`)
      }
    }

    // 步骤4：烹饪过程
    if (recipeType === '粥类') {
      steps.push(`4. 大火煮沸后转小火慢煮，加入${supplementaryIngredients.join('、')}继续煮至食材熟烂。`)
    } else if (recipeType === '汤类') {
      steps.push('4. 大火煮沸后转小火炖煮40-60分钟，至食材熟烂。')
    } else if (recipeType === '蒸品') {
      steps.push('4. 将食材放入蒸锅，蒸15-20分钟至熟透。')
    } else if (recipeType === '素炒') {
      steps.push(`4. 加入${mainIngredients.join('、')}继续翻炒至断生。`)
    }

    // 步骤5：调味
    if (seasonings.length > 0) {
      steps.push(`5. 加入${seasonings.join('、')}调味，即可出锅食用。`)
    } else {
      steps.push('5. 根据个人口味适量调味，即可出锅食用。')
    }

    return steps
  }

  /**
   * 确定食谱功效
   * @private
   * @param {Array} topIngredients - 主要食材
   * @param {string} constitutionType - 体质类型
   * @param {Array} symptoms - 症状列表
   * @returns {Array} 功效列表
   */
  _determineRecipeEffects (topIngredients, constitutionType, symptoms) {
    const effects = new Set()

    // 根据体质添加基础功效
    switch (constitutionType) {
      case '阳虚体质':
        effects.add('温阳补虚')
        effects.add('健脾暖胃')
        break
      case '阴虚体质':
        effects.add('滋阴润燥')
        effects.add('清热生津')
        break
      case '气虚体质':
        effects.add('补气健脾')
        effects.add('益气养血')
        break
      case '痰湿体质':
        effects.add('健脾化湿')
        effects.add('燥湿化痰')
        break
      case '湿热体质':
        effects.add('清热利湿')
        effects.add('解毒消炎')
        break
      case '血瘀体质':
        effects.add('活血化瘀')
        effects.add('通络止痛')
        break
      case '气郁体质':
        effects.add('疏肝解郁')
        effects.add('理气和胃')
        break
      case '特禀体质':
        effects.add('调和脏腑')
        effects.add('增强免疫')
        break
      case '平和体质':
      default:
        effects.add('调和阴阳')
        effects.add('平衡气血')
        break
    }

    // 根据症状添加针对性功效
    if (symptoms && symptoms.length > 0) {
      symptoms.forEach(symptom => {
        switch (symptom) {
          case '咳嗽':
            effects.add('止咳化痰')
            break
          case '失眠':
            effects.add('安神助眠')
            break
          case '乏力':
            effects.add('补气提神')
            break
          case '胃痛':
            effects.add('和胃止痛')
            break
          case '腹泻':
            effects.add('健脾止泻')
            break
          case '头痛':
            effects.add('平肝熄风')
            break
        }
      })
    }

    // 根据主要食材添加功效
    topIngredients.forEach(ingredient => {
      if (ingredient.functions) {
        ingredient.functions.forEach(func => effects.add(func))
      }
    })

    return [...effects]
  }

  /**
   * 估算食谱的营养价值
   * @private
   * @param {Array} ingredients - 食材列表
   * @returns {Object} 营养价值
   */
  _estimateNutritionalValue (ingredients) {
    const nutritionalValue = {
      protein: 'low',
      fiber: 'low',
      vitamins: [],
      minerals: []
    }

    let proteinScore = 0
    let fiberScore = 0

    ingredients.forEach(ingredient => {
      // 添加维生素和矿物质
      if (ingredient.nutritionalValue) {
        if (ingredient.nutritionalValue.protein === '高') {
          proteinScore += 2
        } else if (ingredient.nutritionalValue.protein === '中') {
          proteinScore += 1
        }

        if (ingredient.nutritionalValue.other &&
            ingredient.nutritionalValue.other.includes('膳食纤维')) {
          fiberScore += 1
        }

        if (ingredient.nutritionalValue.vitamins) {
          ingredient.nutritionalValue.vitamins.forEach(vitamin => {
            if (!nutritionalValue.vitamins.includes(vitamin)) {
              nutritionalValue.vitamins.push(vitamin)
            }
          })
        }

        if (ingredient.nutritionalValue.minerals) {
          ingredient.nutritionalValue.minerals.forEach(mineral => {
            if (!nutritionalValue.minerals.includes(mineral)) {
              nutritionalValue.minerals.push(mineral)
            }
          })
        }
      }

      // 根据食材类别估算
      if (ingredient.category) {
        if (['肉类', '禽类', '鱼类', '蛋类'].includes(ingredient.category)) {
          proteinScore += 2
        } else if (['豆类', '谷物类'].includes(ingredient.category)) {
          proteinScore += 1
          fiberScore += 1
        } else if (['蔬菜类', '水果类'].includes(ingredient.category)) {
          fiberScore += 2
        }
      }
    })

    // 根据分数确定等级
    if (proteinScore > 5) {
      nutritionalValue.protein = 'high'
    } else if (proteinScore > 2) {
      nutritionalValue.protein = 'medium'
    }

    if (fiberScore > 5) {
      nutritionalValue.fiber = 'high'
    } else if (fiberScore > 2) {
      nutritionalValue.fiber = 'medium'
    }

    return nutritionalValue
  }

  /**
   * 获取食谱禁忌人群
   * @private
   * @param {Array} ingredients - 食材列表
   * @returns {Array} 禁忌人群
   */
  _getContraindications (ingredients) {
    const contraindications = new Set()

    ingredients.forEach(ingredient => {
      if (ingredient.contraindications) {
        ingredient.contraindications.forEach(contra => {
          contraindications.add(contra)
        })
      }
    })

    return [...contraindications]
  }

  /**
   * 判断症状是否与证型相关
   * @private
   * @param {string} symptom - 症状
   * @param {string} condition - 证型
   * @returns {boolean} 是否相关
   */
  _isSymptomRelatedToCondition (symptom, condition) {
    // 简单相关性判断
    if (condition.includes(symptom) || symptom.includes(condition)) {
      return true
    }

    // 可以通过TCM知识库实现更复杂的关联
    if (this.tcmKnowledgeService) {
      try {
        return this.tcmKnowledgeService.isSymptomRelatedToPattern(symptom, condition)
      } catch (error) {
        logger.warn('判断症状与证型关系失败', { symptom, condition, error: error.message })
      }
    }

    return false
  }

  /**
   * 判断功能是否与症状相关
   * @private
   * @param {string} function_ - 功能
   * @param {string} symptom - 症状
   * @returns {boolean} 是否相关
   */
  _isFunctionRelevantToSymptom (function_, symptom) {
    // 简单相关性判断
    if (function_.includes(symptom) || symptom.includes(function_)) {
      return true
    }

    // 特定功能与症状的映射关系
    const functionSymptomMap = {
      补气: ['乏力', '疲劳', '气短', '懒言'],
      益气: ['乏力', '疲劳', '气短', '懒言'],
      补血: ['面色萎黄', '眩晕', '心悸', '失眠'],
      活血: ['疼痛', '瘀斑', '经闭', '胸痹'],
      化瘀: ['疼痛', '瘀斑', '经闭', '胸痹'],
      止痛: ['疼痛', '头痛', '腹痛', '胃痛'],
      理气: ['胸闷', '胁痛', '脘痞', '情志不畅'],
      和胃: ['胃痛', '嗳气', '恶心', '呕吐'],
      消食: ['食积', '腹胀', '消化不良'],
      清热: ['发热', '口渴', '烦躁', '口苦'],
      解毒: ['疮疡', '痈肿', '咽痛', '口腔溃疡'],
      祛湿: ['水肿', '泄泻', '痰多', '关节疼痛'],
      化痰: ['咳嗽', '咳痰', '胸闷', '喘息'],
      止咳: ['咳嗽', '咽痒', '咽痛'],
      平喘: ['喘息', '气短', '呼吸困难'],
      安神: ['失眠', '健忘', '心悸', '多梦'],
      养心: ['心悸', '失眠', '心烦', '健忘']
    }

    if (functionSymptomMap[function_] && functionSymptomMap[function_].includes(symptom)) {
      return true
    }

    // 可以通过TCM知识库实现更复杂的关联
    if (this.tcmKnowledgeService) {
      try {
        return this.tcmKnowledgeService.isFunctionRelevantToSymptom(function_, symptom)
      } catch (error) {
        logger.warn('判断功能与症状关系失败', { function_, symptom, error: error.message })
      }
    }

    return false
  }

  /**
   * 判断证型是否与体质相关
   * @private
   * @param {string} condition - 证型
   * @param {string} constitutionType - 体质类型
   * @returns {boolean} 是否相关
   */
  _isConditionMatchConstitution (condition, constitutionType) {
    // 简单相关性判断
    if (condition.includes(constitutionType) || constitutionType.includes(condition)) {
      return true
    }

    // 特定证型与体质的映射关系
    const conditionConstitutionMap = {
      阳虚: ['阳虚体质'],
      阳虚证: ['阳虚体质'],
      阴虚: ['阴虚体质'],
      阴虚证: ['阴虚体质'],
      气虚: ['气虚体质'],
      气虚证: ['气虚体质'],
      湿热: ['湿热体质'],
      湿热证: ['湿热体质'],
      痰湿: ['痰湿体质'],
      痰湿证: ['痰湿体质'],
      血瘀: ['血瘀体质'],
      血瘀证: ['血瘀体质'],
      气郁: ['气郁体质'],
      气郁证: ['气郁体质']
    }

    if (conditionConstitutionMap[condition] &&
        conditionConstitutionMap[condition].includes(constitutionType)) {
      return true
    }

    // 可以通过TCM知识库实现更复杂的关联
    if (this.tcmKnowledgeService) {
      try {
        return this.tcmKnowledgeService.isConditionMatchConstitution(condition, constitutionType)
      } catch (error) {
        logger.warn('判断证型与体质关系失败', { condition, constitutionType, error: error.message })
      }
    }

    return false
  }

  /**
   * 标准化体质类型名称
   * @private
   * @param {string} constitutionType - 体质类型
   * @returns {string} 标准化的体质类型
   */
  _normalizeConstitutionType (constitutionType) {
    if (!constitutionType) return '平和体质'

    // 移除可能的额外空格
    const normalizedType = constitutionType.trim()

    // 确保体质名称以"体质"结尾
    if (!normalizedType.endsWith('体质')) {
      return normalizedType + '体质'
    }

    return normalizedType
  }

  /**
   * 获取当前季节
   * @private
   * @returns {string} 当前季节
   */
  _getCurrentSeason () {
    const month = new Date().getMonth() + 1 // 月份从0开始

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
   * 获取当前节气
   * @private
   * @returns {string} 当前节气
   */
  _getCurrentSolarTerm () {
    // 简化版获取节气，未来可以实现更精确的算法
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 简化的节气对应表
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

    // 查找当前节气
    if (solarTerms[month]) {
      for (let i = solarTerms[month].length - 1; i >= 0; i--) {
        if (day >= solarTerms[month][i].day) {
          return solarTerms[month][i].term
        }
      }
    }

    // 如果无法确定，返回上个月的最后一个节气
    const prevMonth = month === 1 ? 12 : month - 1
    if (solarTerms[prevMonth] && solarTerms[prevMonth].length > 0) {
      return solarTerms[prevMonth][solarTerms[prevMonth].length - 1].term
    }

    // 默认返回冬至
    return '冬至'
  }

  /**
   * 保存生成的食谱
   * @private
   * @param {string} recipeId - 食谱ID
   * @param {Object} recipe - 食谱
   * @returns {Promise<void>}
   */
  async _saveGeneratedRecipe (recipeId, recipe) {
    try {
      const recipePath = path.join(this.generatedRecipesDir, `${recipeId}.json`)
      await fs.writeJson(recipePath, recipe, { spaces: 2 })
      logger.info('食谱保存成功', { recipeId })
    } catch (error) {
      logger.error('保存食谱失败', { recipeId, error: error.message })
      throw error
    }
  }

  /**
   * 根据ID获取生成的食谱
   * @param {string} recipeId - 食谱ID
   * @returns {Promise<Object>} 食谱
   */
  async getGeneratedRecipe (recipeId) {
    try {
      const recipePath = path.join(this.generatedRecipesDir, `${recipeId}.json`)
      if (await fs.pathExists(recipePath)) {
        return await fs.readJson(recipePath)
      }
      throw new Error('食谱不存在')
    } catch (error) {
      logger.error('获取食谱失败', { recipeId, error: error.message })
      throw error
    }
  }

  /**
   * 获取用户的所有生成食谱
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 食谱列表
   */
  async getUserRecipes (userId) {
    try {
      const recipes = []
      const files = await fs.readdir(this.generatedRecipesDir)

      for (const file of files) {
        if (file.endsWith('.json')) {
          const recipePath = path.join(this.generatedRecipesDir, file)
          const recipe = await fs.readJson(recipePath)

          if (recipe.userId === userId) {
            recipes.push(recipe)
          }
        }
      }

      // 按创建时间排序
      return recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      logger.error('获取用户食谱失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 统一饮品生成入口
   * @param {Object} options 选项
   * @returns {Promise<Object>} 生成的饮品配方
   */
  async generateBeverage (options) {
    const {
      userId,
      beverageType, // 饮品类别ID
      constitutionType,
      symptoms = [],
      season,
      solarTerm,
      healthGoals = [],
      dietaryPreferences = [],
      dietaryRestrictions = [],
      // 酒类特有
      preferredBase,
      // 经方古方特有
      severity
    } = options

    // 验证用户是否符合当前饮品种类的限制条件
    await this._validateUserForBeverageType(userId, beverageType)

    // 根据饮品类别调用相应的生成方法
    switch (beverageType) {
      case 'medicinal_food':
      case 'herbal_spice':
        return this.generateHerbalBeverage({
          userId,
          beverageType,
          constitutionType,
          symptoms,
          season,
          solarTerm,
          dietaryPreferences,
          dietaryRestrictions
        })

      case 'classic_formula':
        return this.generateClassicFormula({
          userId, constitutionType, symptoms, severity
        })

      case 'medicinal_wine':
      case 'infused_wine':
        return this.generateMedicinalWine({
          userId,
          constitutionType,
          healthGoals,
          preferredBase,
          isMedicinalWine: beverageType === 'medicinal_wine'
        })

      default:
        throw new Error(`不支持的饮品类型: ${beverageType}`)
    }
  }

  /**
   * 验证用户是否符合饮品类别的要求
   * @private
   */
  async _validateUserForBeverageType (userId, beverageType) {
    try {
      // 获取饮品类别配置
      const beverageSystem = await this._loadBeverageSystem()
      const category = beverageSystem.categories.find(c => c.id === beverageType)

      if (!category) {
        throw new Error(`未知饮品类别: ${beverageType}`)
      }

      // 检查年龄限制
      if (category.ageRestriction > 0) {
        const userProfile = await this.userProfileService.getUserProfile(userId)

        if (!userProfile.age || userProfile.age < category.ageRestriction) {
          throw new Error(`此饮品类别要求年龄不低于${category.ageRestriction}岁`)
        }
      }

      return true
    } catch (error) {
      logger.error('验证用户饮品权限失败', { userId, beverageType, error: error.message })
      throw error
    }
  }

  /**
   * 加载饮品系统配置
   * @private
   */
  async _loadBeverageSystem () {
    try {
      const filePath = path.join(this.knowledgeDir, 'beverage_system.json')
      return await fs.readJson(filePath)
    } catch (error) {
      logger.error('加载饮品系统配置失败', error)
      throw new Error('无法加载饮品系统配置')
    }
  }
}

module.exports = RecipeGenerationService
