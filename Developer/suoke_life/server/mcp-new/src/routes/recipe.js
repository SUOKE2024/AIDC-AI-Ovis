/**
 * 食谱API路由
 * 提供食谱智能生成的REST API接口
 */

const express = require('express')
const { createPermissionMiddleware, createAuthMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建食谱路由
 * @param {Object} options - 路由选项
 * @param {Object} options.recipeGenerationService - 食谱生成服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createRecipeRouter (options) {
  const router = express.Router()
  const recipeGenerationService = options.recipeGenerationService
  const authProvider = options.authProvider

  // 认证中间件
  const requireAuth = createAuthMiddleware(authProvider)

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'recipe',
    resource
  )

  /**
   * @swagger
   * /api/recipe/generate:
   *   post:
   *     summary: 生成个性化药膳食谱
   *     description: 根据用户体质、症状、季节等信息生成个性化药膳食谱
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               constitutionType:
   *                 type: string
   *                 description: 体质类型
   *               symptoms:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 症状列表
   *               season:
   *                 type: string
   *                 description: 季节(春/夏/秋/冬)
   *               solarTerm:
   *                 type: string
   *                 description: 节气
   *               dietaryPreferences:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 饮食偏好
   *               dietaryRestrictions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 饮食限制
   *     responses:
   *       200:
   *         description: 生成的食谱
   *       400:
   *         description: 请求错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.post('/generate', requireAuth, async (req, res) => {
    try {
      const {
        constitutionType,
        symptoms,
        season,
        solarTerm,
        dietaryPreferences,
        dietaryRestrictions
      } = req.body

      const userId = req.user.id

      // 生成个性化食谱
      const recipe = await recipeGenerationService.generatePersonalizedRecipe({
        userId,
        constitutionType,
        symptoms,
        season,
        solarTerm,
        dietaryPreferences,
        dietaryRestrictions
      })

      res.status(200).json(recipe)
    } catch (error) {
      logger.error('生成个性化食谱API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recipe/{recipeId}:
   *   get:
   *     summary: 获取食谱详情
   *     description: 根据ID获取食谱详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: recipeId
   *         required: true
   *         schema:
   *           type: string
   *         description: 食谱ID
   *     responses:
   *       200:
   *         description: 食谱详情
   *       404:
   *         description: 食谱不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/:recipeId', requireAuth, async (req, res) => {
    try {
      const recipeId = req.params.recipeId

      // 获取食谱详情
      const recipe = await recipeGenerationService.getGeneratedRecipe(recipeId)

      // 检查权限（只能查看自己的食谱，除非是管理员）
      if (recipe.userId !== req.user.id && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问此食谱'
          }
        })
      }

      res.status(200).json(recipe)
    } catch (error) {
      if (error.message === '食谱不存在') {
        return res.status(404).json({
          error: {
            message: '食谱不存在'
          }
        })
      }

      logger.error('获取食谱详情API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recipe/user/list:
   *   get:
   *     summary: 获取用户食谱列表
   *     description: 获取当前用户的所有食谱
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 食谱列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/user/list', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id

      // 获取用户食谱列表
      const recipes = await recipeGenerationService.getUserRecipes(userId)

      res.status(200).json(recipes)
    } catch (error) {
      logger.error('获取用户食谱列表API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recipe/beverage/generate:
   *   post:
   *     summary: 生成各类饮品配方
   *     description: 根据用户体质、健康状况等生成个性化饮品配方，支持五大类别
   */
  router.post('/beverage/generate', requireAuth, async (req, res) => {
    try {
      const {
        beverageType,
        constitutionType,
        symptoms = [],
        season,
        solarTerm,
        healthGoals = [],
        dietaryPreferences = [],
        dietaryRestrictions = [],
        preferredBase,
        severity
      } = req.body

      const userId = req.user.id

      // 根据饮品类型添加特定的响应头
      if (['medicinal_wine', 'infused_wine'].includes(beverageType)) {
        res.set('X-Alcohol-Warning', 'Contains alcohol. Not for persons under 18.')
      }

      if (beverageType === 'classic_formula') {
        res.set('X-Medical-Disclaimer', 'This is not medical advice. Consult a professional.')
      }

      // 生成饮品配方
      const beverage = await recipeGenerationService.generateBeverage({
        userId,
        beverageType,
        constitutionType,
        symptoms,
        season,
        solarTerm,
        healthGoals,
        dietaryPreferences,
        dietaryRestrictions,
        preferredBase,
        severity
      })

      res.status(200).json(beverage)
    } catch (error) {
      logger.error('生成饮品API错误', error)

      // 根据错误类型返回适当的状态码
      let statusCode = 500
      if (error.message.includes('未满18岁') || error.message.includes('年龄不低于')) {
        statusCode = 403
      } else if (error.message.includes('症状可能较为严重')) {
        statusCode = 400
      }

      res.status(statusCode).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recipe/beverage/categories:
   *   get:
   *     summary: 获取饮品分类信息
   *     description: 获取所有支持的饮品类别及其元数据
   */
  router.get('/beverage/categories', async (req, res) => {
    try {
      const categories = await recipeGenerationService.getBeverageCategories()
      res.status(200).json(categories)
    } catch (error) {
      logger.error('获取饮品分类API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recipe/beverage/{beverageId}:
   *   get:
   *     summary: 获取饮品详情
   *     description: 根据ID获取生成的饮品配方详情
   */
  router.get('/beverage/:beverageId', requireAuth, async (req, res) => {
    try {
      const beverageId = req.params.beverageId
      const beverage = await recipeGenerationService.getGeneratedRecipe(beverageId)

      // 验证用户权限
      if (beverage.userId !== req.user.id && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问此饮品配方'
          }
        })
      }

      res.status(200).json(beverage)
    } catch (error) {
      logger.error('获取饮品详情API错误', error)
      res.status(error.message.includes('不存在') ? 404 : 500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  return router
}

module.exports = createRecipeRouter
